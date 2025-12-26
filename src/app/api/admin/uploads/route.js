import { NextResponse } from 'next/server';
import { requireAdmin, requireSuper } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

// Note: This route expects a multipart/form-data POST with a field named "file";
// The file will be written to the `public/uploads/` directory and the returned
// JSON contains the public URL (e.g. { ok: true, url: '/uploads/abc.jpg' }).

export const runtime = 'nodejs';

import patchUrlParse from '@/utils/patchUrlParse';

// Apply shared url.parse patch (uses require-based patch which avoids ESM assignment errors)
patchUrlParse();

export async function POST(req) {
  // protect admin route (admins and supers can upload)
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name || `upload-${Date.now()}`;
    const allowed = ['image/png','image/jpeg','image/jpg','image/gif','image/svg+xml','video/mp4','video/webm','video/ogg','video/quicktime','video/x-msvideo','video/mpeg'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // size limit: 5MB for images, 50MB for videos
    const buf = Buffer.from(await file.arrayBuffer());
    const maxBytes = (file && file.type && file.type.startsWith && file.type.startsWith('video')) ? (50 * 1024 * 1024) : (5 * 1024 * 1024);
    if (buf.length > maxBytes) {
      return NextResponse.json({ error: `File too large (max ${Math.round(maxBytes / (1024*1024))}MB)` }, { status: 400 });
    }
    // upload to Cloudinary if configured
    let url = null;
    let finalName = null;
    let publicId = null;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

      try {
        // build a public id with folder + sanitized filename to reduce collisions
        const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-');
        const publicIdPrefix = `pk-uploads/${Date.now()}-${safeName}`;

        const isVideo = (file && file.type && file.type.startsWith && file.type.startsWith('video'));
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ public_id: publicIdPrefix, resource_type: isVideo ? 'video' : 'image' }, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
          stream.end(buf);
        });

        url = uploadResult.secure_url;
        // sanitize public_id: remove any file extension to avoid duplicated extensions
        let pid = uploadResult.public_id || '';
        pid = pid.replace(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|mp4|webm|ogg|mov|m4v|mpeg)$/i, '');
        finalName = `${pid}${uploadResult.format ? `.${uploadResult.format}` : ''}`;
        publicId = pid;
      } catch (e) {
        console.warn('[api/admin/uploads] cloudinary upload failed, falling back to local', e);
      }
    }

    // fallback to local filesystem if cloudinary not configured or upload failed
    if (!url) {
      const fs = await import('fs');
      const path = await import('path');
      const publicDir = path.join(process.cwd(), 'public');
      const uploadsDir = path.join(publicDir, 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-');
      finalName = `${Date.now()}-${safeName}`;
      const outPath = path.join(uploadsDir, finalName);
      fs.writeFileSync(outPath, buf);

      url = `/uploads/${finalName}`;
    }

    // record ownership metadata so admins can delete their own uploads later
    try {
      const path = await import('path');
      const fs = await import('fs');
      const dataPath = path.join(process.cwd(), 'src', 'data', 'uploads.json');
      let index = { uploads: [] };
      if (fs.existsSync(dataPath)) {
        try { index = JSON.parse(fs.readFileSync(dataPath, 'utf8')) || { uploads: [] }; } catch (e) { index = { uploads: [] }; }
      }
      index.uploads = index.uploads || [];
      const rec = { url, filename: finalName, ownerId: auth.id, ownerEmail: auth.email, createdAt: Date.now() };
      if (publicId) rec.publicId = publicId;
      if (publicId) rec.provider = 'cloudinary';
      // preserve resource type (video|image) when available
      if (typeof file !== 'undefined' && file && file.type && file.type.startsWith && file.type.startsWith('video')) rec.resourceType = 'video';
      else rec.resourceType = 'image';
      index.uploads.push(rec);
      fs.writeFileSync(dataPath, JSON.stringify(index, null, 2));
    } catch (e) {
      // non-fatal: continue even if metadata write fails
      console.warn('[api/admin/uploads] metadata write failed', e);
    }

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error('[api/admin/uploads] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req) {
  // allow admins/supers to delete uploads; supers can delete any, admins can delete their own
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const body = await req.json();
    const url = body && body.url;
    if (!url || typeof url !== 'string' || (!url.startsWith('/uploads/') && !url.startsWith('http://') && !url.startsWith('https://'))) return NextResponse.json({ error: 'Invalid url' }, { status: 400 });

    const path = await import('path');
    const fs = await import('fs');

    const dataPath = path.join(process.cwd(), 'src', 'data', 'uploads.json');
    let index = { uploads: [] };
    if (fs.existsSync(dataPath)) {
      try { index = JSON.parse(fs.readFileSync(dataPath, 'utf8')) || { uploads: [] }; } catch (e) { index = { uploads: [] }; }
    }

    const idx = (index.uploads || []).findIndex(u => u.url === url);
    if (idx === -1) {
      // not indexed - only super may delete unknown uploads
      if (auth.role !== 'super') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } else {
      const rec = index.uploads[idx];
      if (auth.role !== 'super' && rec.ownerId !== auth.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // If this is a Cloudinary upload, call Cloudinary destroy
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (idx !== -1 && index.uploads[idx].provider === 'cloudinary') {
      if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      const rec = index.uploads[idx];
      try {
        if (rec.publicId) {
          await cloudinary.uploader.destroy(rec.publicId, { resource_type: rec.resourceType || 'image' });
        } else {
          // try to parse public id from url as a fallback (image or video)
          const m = url.match(/res\.cloudinary\.com\/[\w-]+\/(?:image|video)\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|svg|bmp|tiff|mp4|webm|ogg|mov|m4v|mpeg)$/i);
          const pid = m && m[1] ? decodeURIComponent(m[1]) : null;
          if (pid) await cloudinary.uploader.destroy(pid, { resource_type: rec.resourceType || 'image' });
        }
      } catch (e) {
        console.error('[api/admin/uploads DELETE] cloudinary destroy error', e);
        return NextResponse.json({ error: 'Failed to delete from Cloudinary' }, { status: 500 });
      }

      // remove metadata
      index.uploads.splice(idx, 1);
      try { fs.writeFileSync(dataPath, JSON.stringify(index, null, 2)); } catch (e) { /* non-fatal */ }

      return NextResponse.json({ ok: true });
    }

    // Local filesystem delete
    if (url.startsWith('/uploads/')) {
      const p = path.join(process.cwd(), 'public', url.replace(/^\//, ''));
      if (!fs.existsSync(p)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      fs.unlinkSync(p);

      // remove metadata if present
      if (idx !== -1) {
        index.uploads.splice(idx, 1);
        try { fs.writeFileSync(dataPath, JSON.stringify(index, null, 2)); } catch (e) { /* non-fatal */ }
      }

      return NextResponse.json({ ok: true });
    }

    // For other external URLs (e.g., Cloudinary but not indexed) only super can delete and attempt deletion
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // only super allowed for unknown external urls
      if (auth.role !== 'super') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      // try to parse public id from url (image or video)
      const m = url.match(/res\.cloudinary\.com\/[\w-]+\/(?:image|video)\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|svg|bmp|tiff|mp4|webm|ogg|mov|m4v|mpeg)$/i);
      const pid = m && m[1] ? decodeURIComponent(m[1]) : null;
      if (!pid) return NextResponse.json({ error: 'Could not parse public id' }, { status: 400 });
      // decide resource type from extension
      const isVideo = /\.(mp4|webm|ogg|mov|m4v|mpeg)(?:\?|$)/i.test(url);
      try {
        await cloudinary.uploader.destroy(pid, { resource_type: isVideo ? 'video' : 'image' });
      } catch (e) {
        console.error('[api/admin/uploads DELETE] cloudinary destroy error for unknown url', e);
        return NextResponse.json({ error: 'Failed to delete from Cloudinary' }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  } catch (err) {
    console.error('[api/admin/uploads DELETE] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
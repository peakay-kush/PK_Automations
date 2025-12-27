import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

async function readTutorialsFile() {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'tutorials.json');
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.tutorials || [];
  } catch (err) {
    return [];
  }
}

async function writeTutorialsFile(data) {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'tutorials.json');
  const json = { tutorials: data };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    const tutorials = await readTutorialsFile();
    const t = tutorials.find((x) => x.id === id);
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(t);
  } catch (err) {
    console.error('[api/admin/tutorials/[id] GET] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    const body = await req.json();
    const tutorials = await readTutorialsFile();
    const idx = tutorials.findIndex((x) => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (body.images && !Array.isArray(body.images)) body.images = [body.images];

    const updated = Object.assign({}, tutorials[idx], body);
    if (updated.images && updated.images.length > 0) {
      updated.image = updated.images[0];
      if (!updated.thumbnail) updated.thumbnail = updated.images[0];
    }

    tutorials[idx] = updated;
    await writeTutorialsFile(tutorials);
    return NextResponse.json({ ok: true, tutorial: updated });
  } catch (err) {
    console.error('[api/admin/tutorials/[id] PUT] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    let tutorials = await readTutorialsFile();
    const idx = tutorials.findIndex((x) => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // attempt to remove any uploaded images if they live in /uploads
    try {
      const target = tutorials[idx];
      if (target) {
        const imgs = [];
        if (target.image && typeof target.image === 'string') imgs.push(target.image);
        if (Array.isArray(target.images)) imgs.push(...target.images);
        for (const im of imgs) {
          if (im && typeof im === 'string' && im.startsWith('/uploads/')) {
            const p = path.join(process.cwd(), 'public', im.replace(/^\//, ''));
            if (fs.existsSync(p)) fs.unlinkSync(p);
          }
        }
      }
    } catch (e) { /* ignore */ }

    tutorials.splice(idx, 1);
    await writeTutorialsFile(tutorials);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/tutorials/[id] DELETE] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

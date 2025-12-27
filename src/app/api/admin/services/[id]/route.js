import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

async function readServicesFile() {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'services.json');
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.services || [];
  } catch (err) {
    return [];
  }
}
async function writeServicesFile(data) {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'services.json');
  const json = { services: data };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    const services = await readServicesFile();
    const s = services.find((x) => x.id === id);
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(s);
  } catch (err) {
    console.error('[api/admin/services/[id] GET] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    const body = await req.json();

    // Sanitize incoming body to remove DOM/React internals before merging
    function sanitize(obj) {
      const seen = new WeakSet();
      function _clone(v) {
        if (v && typeof v === 'object') {
          if (seen.has(v)) return undefined;
          if (typeof v.nodeType === 'number' || v._reactInternals || v._reactRootContainer) return undefined;
          seen.add(v);
          if (Array.isArray(v)) return v.map(_clone).filter(x => x !== undefined);
          const out = {};
          for (const k of Object.keys(v)) {
            if (k && k.startsWith('_')) continue;
            const c = _clone(v[k]);
            if (c !== undefined) out[k] = c;
          }
          return out;
        }
        if (typeof v === 'function') return undefined;
        return v;
      }
      return _clone(obj);
    }

    const services = await readServicesFile();
    const idx = services.findIndex((x) => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const cleaned = sanitize(body) || {};
    if (cleaned.images && !Array.isArray(cleaned.images)) cleaned.images = [cleaned.images];

    const updated = Object.assign({}, services[idx], cleaned);
    if (updated.images && updated.images.length > 0) updated.image = updated.images[0];

    services[idx] = updated;
    await writeServicesFile(services);
    return NextResponse.json({ ok: true, service: updated });
  } catch (err) {
    console.error('[api/admin/services/[id] PUT] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    let services = await readServicesFile();
    const idx = services.findIndex((x) => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // attempt to remove any uploaded images if they live in /uploads
    try {
      const fs = await import('fs');
      const path = await import('path');
      const target = services[idx];
      if (target) {
        const imgs = [];
        if (target.image && typeof target.image === 'string') imgs.push(target.image);
        if (Array.isArray(target.images)) imgs.push(...target.images);
        // attachments may be objects {url,mime,name}
        if (Array.isArray(target.attachments)) {
          for (const a of target.attachments) if (a && a.url) imgs.push(a.url);
        }
        for (const im of imgs) {
          if (im && typeof im === 'string' && im.startsWith('/uploads/')) {
            const p = path.join(process.cwd(), 'public', im.replace(/^\//, ''));
            if (fs.existsSync(p)) fs.unlinkSync(p);
          }
        }
      }
    } catch (e) { /* ignore */ }

    services.splice(idx, 1);
    await writeServicesFile(services);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/services/[id] DELETE] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

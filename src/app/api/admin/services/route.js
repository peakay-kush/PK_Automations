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

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const services = await readServicesFile();
    return NextResponse.json(services);
  } catch (err) {
    console.error('[api/admin/services] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const body = await req.json();
    if (!body || !body.name) return NextResponse.json({ error: 'Invalid payload: name required' }, { status: 422 });

    // Sanitize incoming body to remove any DOM/React internals
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

    const cleaned = sanitize(body);
    const services = await readServicesFile();
    const id = Date.now();
    if (cleaned.images && !Array.isArray(cleaned.images)) cleaned.images = [cleaned.images];
    const newService = Object.assign({ id }, cleaned);
    if (!newService.image && newService.images && newService.images.length > 0) newService.image = newService.images[0];
    services.push(newService);
    await writeServicesFile(services);
    return NextResponse.json({ ok: true, service: newService }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/services POST] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

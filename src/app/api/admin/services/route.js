import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

const dataPath = path.join(process.cwd(), 'src', 'data', 'services.json');
function readServicesFile() {
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.services || [];
  } catch (err) {
    return [];
  }
}
function writeServicesFile(services) {
  // Sanitize services before writing to disk to avoid persisting React/DOM internals
  function _sanitize(obj) {
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

  const cleaned = (services || []).map((s) => {
    const c = _sanitize(s) || {};
    // Normalize images and attachments
    if (c.images && !Array.isArray(c.images)) c.images = [c.images];
    if (c.attachments && Array.isArray(c.attachments)) c.attachments = c.attachments.map(a => ({ url: a && a.url ? a.url : a, mime: a && a.mime ? a.mime : null, name: a && a.name ? a.name : null }));
    return c;
  });

  const json = { services: cleaned };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const services = readServicesFile();
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
    const services = readServicesFile();
    const id = Date.now();
    if (cleaned.images && !Array.isArray(cleaned.images)) cleaned.images = [cleaned.images];
    const newService = Object.assign({ id }, cleaned);
    if (!newService.image && newService.images && newService.images.length > 0) newService.image = newService.images[0];
    services.push(newService);
    writeServicesFile(services);
    return NextResponse.json({ ok: true, service: newService }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/services POST] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

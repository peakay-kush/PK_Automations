import patchUrlParse from '@/utils/patchUrlParse';
try {
  if (typeof patchUrlParse === 'function') {
    patchUrlParse();
  }
} catch (e) {
  // non-fatal; log for diagnostics
  console.warn('[api/admin/pages/[id] route] patchUrlParse failed', e && (e.stack || e));
}
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

async function readPagesFile() {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'pages.json');
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.pages || [];
  } catch (err) {
    return [];
  }
}
function _sanitizePage(p) {
  const page = Object.assign({}, p || {});
  if (page.studentHubBullets && Array.isArray(page.studentHubBullets)) {
    page.studentHubBullets = page.studentHubBullets.map((b) => {
      if (b == null) return b;
      if (typeof b === 'object' && !Array.isArray(b)) {
        const keys = Object.keys(b);
        const numericKeys = keys.filter(k => /^[0-9]+$/.test(k)).map(k => parseInt(k, 10)).sort((a,b) => a-b);
        if (numericKeys.length > 0) {
          const str = numericKeys.map(i => String(b[i] || '')).join('');
          if (b.name || b.desc) {
            return { name: (b.name || str), desc: (b.desc || '') };
          }
          return str;
        }
        if (b.name || b.desc) return { name: b.name || '', desc: b.desc || '' };
      }
      return b;
    });
  }
  return page;
}

async function await writePagesFile(data) {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'pages.json');
  const json = { pages: data };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = params.id;
    const pages = await readPagesFile();
    if (!pages || pages.length === 0) return NextResponse.json({ error: 'No pages configured' }, { status: 404 });

    // Try exact id match, then slug, then title (case-insensitive) to be more forgiving
    let p = pages.find(x => x.id === id);
    if (!p) p = pages.find(x => x.slug === id);
    if (!p) p = pages.find(x => (x.title || '').toLowerCase() === (id || '').toLowerCase());
    if (!p) {
      // last resort: try decodeURIComponent
      try { const decoded = decodeURIComponent(id); p = pages.find(x => x.id === decoded || x.slug === decoded || (x.title || '').toLowerCase() === decoded.toLowerCase()); } catch (e) {}
    }

    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (err) {
    console.error('[api/admin/pages/[id] GET] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = params.id;
    const body = await req.json();
    const pages = await readPagesFile();
    const idx = pages.findIndex(x => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = Object.assign({}, pages[idx], body);
    pages[idx] = updated;
    await writePagesFile(pages);
    return NextResponse.json({ ok: true, page: updated });
  } catch (err) {
    console.error('[api/admin/pages/[id] PUT] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = params.id;
    let pages = await readPagesFile();
    const idx = pages.findIndex(x => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    pages.splice(idx, 1);
    await writePagesFile(pages);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/pages/[id] DELETE] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
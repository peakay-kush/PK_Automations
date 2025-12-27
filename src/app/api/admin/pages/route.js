import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
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
  // Normalize studentHubBullets to proper arrays/objects
  const page = Object.assign({}, p || {});
  if (page.studentHubBullets && Array.isArray(page.studentHubBullets)) {
    page.studentHubBullets = page.studentHubBullets.map((b) => {
      if (b == null) return b;
      // If string-like object with numeric keys, reconstruct
      if (typeof b === 'object' && !Array.isArray(b)) {
        // if keys include numeric indices and also name/desc
        const keys = Object.keys(b);
        const numericKeys = keys.filter(k => /^[0-9]+$/.test(k)).map(k => parseInt(k, 10)).sort((a,b) => a-b);
        if (numericKeys.length > 0) {
          // reassemble string
          const str = numericKeys.map(i => String(b[i] || '')).join('');
          if (b.name || b.desc) {
            return { name: (b.name || str), desc: (b.desc || '') };
          }
          return str;
        }
        // if it's a plain object with name/desc, keep only name/desc
        if (b.name || b.desc) return { name: b.name || '', desc: b.desc || '' };
      }
      // ensure simple string or object preserved
      return b;
    });
  }

  // Additional sanitization can go here
  return page;
}

async function await writePagesFile(data) {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'pages.json');
  const json = { pages: data };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const pages = await readPagesFile();
    return NextResponse.json(pages);
  } catch (err) {
    console.error('[api/admin/pages] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const body = await req.json();
    if (!body || !body.id) return NextResponse.json({ error: 'Missing page id' }, { status: 422 });
    const pages = await readPagesFile();
    const exists = pages.find(p => p.id === body.id);
    if (exists) return NextResponse.json({ error: 'Page already exists' }, { status: 409 });
    pages.push(body);
    await writePagesFile(pages);
    return NextResponse.json({ ok: true, page: body }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/pages POST] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
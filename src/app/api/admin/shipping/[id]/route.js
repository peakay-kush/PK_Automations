import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

async function readFile() {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'shipping.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(raw);
}

async function writeFile(obj) {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'shipping.json');
  fs.writeFileSync(dataPath, JSON.stringify(obj, null, 2));
}

export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const id = Number(params.id);
    const data = await readFile();
    const item = (data.locations || []).find(x => x.id === id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PUT(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const id = Number(params.id);
    const body = await req.json();
    const data = readFile();
    const idx = (data.locations || []).findIndex(x => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = Object.assign({}, data.locations[idx], body);
    data.locations[idx] = updated;
    writeFile(data);
    return NextResponse.json({ ok: true, location: updated });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const id = Number(params.id);
    const data = readFile();
    data.locations = (data.locations || []).filter(x => x.id !== id);
    writeFile(data);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

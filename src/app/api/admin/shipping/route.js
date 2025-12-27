import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

async function readFile() {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'shipping.json');
  if (!fs.existsSync(dataPath)) return { locations: [] };
  const raw = fs.readFileSync(dataPath, 'utf8');
  try { return JSON.parse(raw); } catch (e) { return { locations: [] }; }
}

async function writeFile(obj) {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'shipping.json');
  fs.writeFileSync(dataPath, JSON.stringify(obj, null, 2));
}

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const data = await readFile();
    return NextResponse.json(data.locations || []);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const body = await req.json();
    const data = await readFile();
    const id = Date.now();
    const item = Object.assign({ id }, body);
    data.locations = data.locations || [];
    data.locations.push(item);
    writeFile(data);
    return NextResponse.json({ ok: true, location: item }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

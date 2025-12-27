import { NextResponse } from 'next/server';

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

export async function GET(req, { params }) {
  try {
    const id = params.id;
    const pages = await readPagesFile();
    const p = pages.find(x => x.id === id);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (err) {
    console.error('[api/pages/[id] GET] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

async function readProductsFile() {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'products.json');
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.products || [];
  } catch (err) {
    return [];
  }
}

export async function GET(req, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const products = await readProductsFile();
    const p = products.find((x) => x.id === id);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (err) {
    console.error('[api/products/[id]] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

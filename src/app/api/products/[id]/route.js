import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src', 'data', 'products.json');
function readProductsFile() {
  const raw = fs.readFileSync(dataPath, 'utf8');
  const json = JSON.parse(raw);
  return json.products || [];
}

export async function GET(req, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const products = readProductsFile();
    const p = products.find((x) => x.id === id);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (err) {
    console.error('[api/products/[id]] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

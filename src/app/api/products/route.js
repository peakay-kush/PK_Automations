import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src', 'data', 'products.json');

function readProductsFile() {
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.products || [];
  } catch (err) {
    return [];
  }
}

export async function GET() {
  try {
    const products = readProductsFile();
    return NextResponse.json(products);
  } catch (err) {
    console.error('[api/products] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

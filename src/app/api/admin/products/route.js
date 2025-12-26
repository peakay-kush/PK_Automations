import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

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
function writeProductsFile(products) {
  const json = { products };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

export async function GET(req) {
  // admin list view
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const products = readProductsFile();
    return NextResponse.json(products);
  } catch (err) {
    console.error('[api/admin/products] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const body = await req.json();
    // basic validation
    if (!body || !body.name || !body.category) return NextResponse.json({ error: 'Invalid payload: name and category required' }, { status: 422 });
    if (typeof body.price !== 'undefined' && isNaN(Number(body.price))) return NextResponse.json({ error: 'Invalid price' }, { status: 422 });

    const products = readProductsFile();
    const id = Date.now();
    // ensure images is an array
    if (body.images && !Array.isArray(body.images)) body.images = [body.images];
    const newProduct = Object.assign({ id }, body);
    // keep legacy image field for compatibility
    if (!newProduct.image && newProduct.images && newProduct.images.length > 0) newProduct.image = newProduct.images[0];
    products.push(newProduct);
    writeProductsFile(products);
    return NextResponse.json({ ok: true, product: newProduct }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/products POST] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

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
async function writeProductsFile(data) {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'products.json');
  const json = { products: data };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    const products = await readProductsFile();
    const p = products.find((x) => x.id === id);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (err) {
    console.error('[api/admin/products/[id] GET] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    const body = await req.json();
    // basic validation
    if (body && typeof body.price !== 'undefined' && isNaN(Number(body.price))) return NextResponse.json({ error: 'Invalid price' }, { status: 422 });

    const products = await readProductsFile();
    const idx = products.findIndex((x) => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // ensure images array
    if (body.images && !Array.isArray(body.images)) body.images = [body.images];

    const updated = Object.assign({}, products[idx], body);
    // keep legacy image field in sync
    if (updated.images && updated.images.length > 0) updated.image = updated.images[0];

    const previous = products[idx];
    products[idx] = updated;
    await writeProductsFile(products);

    // If product was previously out of stock and now restocked, notify subscribers
    try {
      const prevQty = (typeof previous.quantity === 'number') ? previous.quantity : undefined;
      const newQty = (typeof updated.quantity === 'number') ? updated.quantity : undefined;
      if ((typeof prevQty === 'number' && prevQty <= 0) && (typeof newQty === 'number' && newQty > 0)) {
        // lazy-load DB and send emails
        const { getDB, saveDB } = await import('@/utils/db');
        const db = await getDB();
        try {
          const stmt = db.prepare('SELECT email FROM restock_subscriptions WHERE productId = ?');
          const notifyEmails = [];
          try {
            stmt.bind([updated.id]);
            while (stmt.step()) {
              const row = stmt.get();
              if (row && row[0]) notifyEmails.push(row[0]);
            }
          } catch (e) {}
          try { stmt.free(); } catch (e) {}

          if (notifyEmails.length > 0) {
            // send emails
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: process.env.EMAIL?.replace(/"/g, '')?.trim(), pass: process.env.PASSWORD?.replace(/"/g, '')?.trim() }
            });

            const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/product/${updated.id}`;
            for (const to of notifyEmails) {
              try {
                await transporter.sendMail({ from: process.env.EMAIL?.replace(/"/g, '')?.trim(), to, subject: `Product back in stock: ${updated.name}`, html: `Good news! <strong>${updated.name}</strong> is back in stock. <a href="${productUrl}">View product</a>` });
              } catch (e) { console.error('email send failed', e); }
            }

            // remove subscriptions for this product
            try {
              const del = db.prepare('DELETE FROM restock_subscriptions WHERE productId = ?');
              del.run([updated.id]);
              try { del.free(); } catch (e) {}
              await saveDB();
            } catch (e) { console.error('failed to clear subscriptions', e); }
          }
        } catch (e) {
          console.error('restock notify failed', e);
        }
      }
    } catch (e) {
      console.error('post-update hook failed', e);
    }

    return NextResponse.json({ ok: true, product: updated });
  } catch (err) {
    console.error('[api/admin/products/[id] PUT] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    let products = await readProductsFile();
    const idx = products.findIndex((x) => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // attempt to remove any uploaded images if they live in /uploads
    try {
      const fs = await import('fs');
      const path = await import('path');
      const target = products[idx];
      if (target) {
        const imgs = [];
        if (target.image && typeof target.image === 'string') imgs.push(target.image);
        if (Array.isArray(target.images)) imgs.push(...target.images);
        for (const im of imgs) {
          if (im && typeof im === 'string' && im.startsWith('/uploads/')) {
            const p = path.join(process.cwd(), 'public', im.replace(/^\//, ''));
            if (fs.existsSync(p)) fs.unlinkSync(p);
          }
        }
      }
    } catch (e) { /* ignore file deletion errors */ }

    products.splice(idx, 1);
    await writeProductsFile(products);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/products/[id] DELETE] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
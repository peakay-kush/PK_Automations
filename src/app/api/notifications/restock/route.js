import { getDB, saveDB } from '@/utils/db';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { productId, email } = body || {};
    if (!productId || !email) return new Response(JSON.stringify({ error: 'productId and email required' }), { status: 422 });
    const db = await getDB();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    const createdAt = new Date().toISOString();

    // avoid duplicate subscription for same email/product
    try {
      const existing = db.exec('SELECT id FROM restock_subscriptions WHERE productId = ? AND email = ? LIMIT 1', [Number(productId), email]);
      // db.exec may not support parameters; fall back to prepare
    } catch (e) {
      // ignore
    }

    try {
      const stmt = db.prepare('SELECT id FROM restock_subscriptions WHERE productId = ? AND email = ? LIMIT 1');
      let found = false;
      try {
        stmt.bind([Number(productId), email]);
        while (await stmt.step()) {
          const row = stmt.get();
          if (row && row[0]) found = true;
        }
      } catch (e) { }
      try { stmt.free(); } catch (e) {}
      if (found) return new Response(JSON.stringify({ ok: true, message: 'Already subscribed' }), { status: 200 });
    } catch (e) {}

    try {
      const insert = db.prepare('INSERT INTO restock_subscriptions (id, productId, email, createdAt) VALUES (?,?,?,?)');
      await insert.run([id, Number(productId), email, createdAt]);
      try { insert.free(); } catch (e) {}
      await saveDB();
    } catch (e) {
      console.error('failed to insert subscription', e);
      return new Response(JSON.stringify({ error: 'Failed to subscribe' }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}

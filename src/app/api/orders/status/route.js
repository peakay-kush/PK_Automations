import { getDB } from '@/utils/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || url.searchParams.get('orderId');
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const db = await getDB();
    const stmt = db.prepare('SELECT id, status, paid, reference FROM orders WHERE id = ?');
    stmt.bind([id]);
    let row = null;
    if (stmt.step()) {
      row = stmt.get();
    }
    try { stmt.free(); } catch (e) {}

    if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    const [orderId, status, paid, reference] = row;
    return new Response(JSON.stringify({ ok: true, id: orderId, status, paid: Boolean(paid), reference }), { status: 200 });
  } catch (e) {
    console.error('orders/status error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}
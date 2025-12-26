import { getDB, saveDB } from '@/utils/db';

export async function POST(req) {
  // Allow only in non-production environments or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG_MPESA !== '1') {
    return new Response(JSON.stringify({ error: 'Not available' }), { status: 404 });
  }

  try {
    const body = await req.json();
    const { orderId, tx } = body || {};
    if (!orderId) return new Response(JSON.stringify({ error: 'Missing orderId' }), { status: 400 });
    const db = await getDB();

    try {
      const fetchHist = db.prepare('SELECT statusHistory, mpesa FROM orders WHERE id = ?');
      fetchHist.bind([orderId]);
      let histRaw = null;
      let mpRaw = null;
      if (fetchHist.step()) {
        const row = fetchHist.get();
        histRaw = row[0];
        mpRaw = row[1];
      }
      try { fetchHist.free(); } catch (e) {}
      const hist = histRaw ? (typeof histRaw === 'string' ? JSON.parse(histRaw) : histRaw) : [];
      hist.push({ status: 'paid', changedAt: new Date().toISOString(), by: 'manual-debug' });
      const updatedMpesa = mpRaw ? (typeof mpRaw === 'string' ? JSON.parse(mpRaw) : mpRaw) : {};
      updatedMpesa.callback = updatedMpesa.callback || {};
      if (tx) updatedMpesa.transaction = tx;

      const stmt = db.prepare('UPDATE orders SET paid = ?, status = ?, mpesa = ?, statusHistory = ? WHERE id = ?');
      stmt.run([1, 'paid', JSON.stringify(updatedMpesa), JSON.stringify(hist), orderId]);
      try { stmt.free(); } catch (e) {}
      await saveDB();
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (e) {
      console.error('manual-pay failed', e);
      return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
}
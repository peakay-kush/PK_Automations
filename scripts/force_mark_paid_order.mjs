import { getDB, saveDB } from '../src/utils/db.js';

const orderId = process.argv[2] || 'mjk5t2mc';
(async () => {
  try {
    const db = await getDB();
    const stmt = db.prepare('SELECT id, reference, email, mpesa, paid, status, statusHistory, lastMpesaUpdateError FROM orders WHERE id = ?');
    stmt.bind([orderId]);
    let row = null;
    if (stmt.step()) row = stmt.get();
    try { stmt.free(); } catch (e) {}
    if (!row) {
      console.log('Order not found', orderId);
      return process.exit(1);
    }
    const [id, reference, email, mpesaRaw, paid, status, statusHistoryRaw, lastErr] = row;
    console.log('Before:', { id, reference, paid, status, lastMpesaUpdateError: lastErr });
    const mpesa = mpesaRaw && typeof mpesaRaw === 'string' ? JSON.parse(mpesaRaw) : (mpesaRaw || {});
    const hist = statusHistoryRaw ? (typeof statusHistoryRaw === 'string' ? JSON.parse(statusHistoryRaw) : statusHistoryRaw) : [];
    hist.push({ status: 'paid', changedAt: new Date().toISOString(), by: 'manual-repair' });

    const stmt2 = db.prepare('UPDATE orders SET paid = ?, status = ?, mpesa = ?, statusHistory = ? WHERE id = ?');
    stmt2.run([1, 'paid', JSON.stringify(mpesa), JSON.stringify(hist), orderId]);
    try { stmt2.free(); } catch (e) {}
    await saveDB();

    // Verify
    const v = db.prepare('SELECT paid, status, statusHistory, lastMpesaUpdateError FROM orders WHERE id = ?');
    v.bind([orderId]);
    let vrow = null;
    if (v.step()) vrow = v.get();
    try { v.free(); } catch (e) {}
    console.log('After:', vrow);
    process.exit(0);
  } catch (e) {
    console.error('Failed to mark paid', e);
    process.exit(2);
  }
})();

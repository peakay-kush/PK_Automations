(async () => {
  try {
    const { getDB } = require('../src/utils/db.js');
    const db = await getDB();
    const userId = '1766668127650';
    const email = 'kuriamundus@gmail.com';
    console.log('Checking orders using query with userId and email:', userId, email);
    const stmt = db.prepare('SELECT id, reference, name, email, phone, items, total, shipping, shippingLocation, paid, paymentMethod, status, statusHistory, mpesa, mpesaMerchantRequestId, mpesaCheckoutRequestId, createdAt FROM orders WHERE userId = ? OR normalizedEmail = lower(?) OR lower(email) = lower(?) ORDER BY createdAt DESC');
    stmt.bind([userId, email, email]);
    const rows = [];
    while (stmt.step()) {
      const r = stmt.get();
      rows.push({ id: r[0], reference: r[1], name: r[2], email: r[3], phone: r[4], total: r[6], paymentMethod: r[10], status: r[11], createdAt: r[16] });
    }
    try { stmt.free(); } catch (e) {}
    console.log('Matched rows count:', rows.length);
    for (const r of rows) console.log(r);
  } catch (e) { console.error(e); process.exit(1); }
})();
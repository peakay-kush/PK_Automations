(async () => {
  try {
    const { getDB, saveDB } = require('../src/utils/db.js');
    const db = await getDB();

    const id = 't' + Date.now().toString(36);
    const ref = 'PK' + Date.now().toString(36).toUpperCase();
    const now = new Date().toISOString();

    const stmt = db.prepare('INSERT INTO orders (id, reference, userId, name, email, normalizedEmail, phone, items, total, shipping, shippingAddress, shippingLocation, paid, paymentMethod, status, statusHistory, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const hist = JSON.stringify([{status:'created', changedAt:now}]);
    stmt.run([id, ref, null, 'Guest User', 'guest@example.com', 'guest@example.com', '+254700000000', JSON.stringify([{id:1,name:'X',price:100,quantity:1}]), 100, 0, null, null, 0, 'free', 'created', hist, now]);
    try { stmt.free(); } catch (e) {}
    await saveDB();
    console.log('Inserted test order', id, ref);

    const payload = { id: 'someuserid', email: 'Guest@Example.com' };
    const stmt2 = db.prepare('SELECT id, reference, name, email, normalizedEmail FROM orders WHERE userId = ? OR normalizedEmail = lower(?) OR lower(email) = lower(?) ORDER BY createdAt DESC');
    stmt2.bind([payload.id, payload.email || '', payload.email || '']);
    while (stmt2.step()) {
      const row = stmt2.get();
      console.log('Matched row:', row);
    }
    try { stmt2.free(); } catch (e) {}
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
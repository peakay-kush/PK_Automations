(async () => {
  try {
    const route = require('../src/app/api/orders/[id]/route.js');
    const { getDB, saveDB } = require('../src/utils/db.js');
    const db = await getDB();
    const id = 'test-invoke-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO orders (id, reference, userId, name, email, normalizedEmail, phone, items, total, shipping, paid, paymentMethod, status, statusHistory, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const hist = JSON.stringify([{status:'created', changedAt:now}]);
    stmt.run([id, 'PKINV'+Date.now().toString(36).toUpperCase(), '1766668127650', 'sam', 'kuriamundus@gmail.com', 'kuriamundus@gmail.com', '+254700000000', JSON.stringify([{id:1,name:'X',price:100,quantity:1}]), 100, 0, 0, 'free', 'created', hist, now]);
    try { stmt.free(); } catch (e) {}
    await saveDB();
    console.log('Inserted', id);

    // construct a fake Request-like object for DELETE
    const headers = new Map();
    headers.set('authorization', 'Bearer FAKE');
    const req = new global.Request('http://example.local', { method: 'DELETE', headers: headers });
    // call the export
    const res = await route.DELETE(req, { params: { id } });
    console.log('route returned', res?.status, res);
    // check db
    const res2 = db.exec('SELECT id FROM orders WHERE id = ' + JSON.stringify(id));
    console.log('exists after call', (res2?.[0]?.values || []).length > 0);
  } catch (e) { console.error('invoke error', e); process.exit(1); }
})();
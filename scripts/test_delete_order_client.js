(async () => {
  try {
    const { getDB, saveDB } = require('../src/utils/db.js');
    const jwt = require('jsonwebtoken');
    const fetch = global.fetch || require('node-fetch');
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env.local');
    const env = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).reduce((acc, line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m) acc[m[1]] = m[2].replace(/^"|"$/g, '').trim();
      return acc;
    }, {});
    const SECRET = env.JWT_SECRET || env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

    const db = await getDB();
    const id = 't' + Date.now().toString(36);
    const ref = 'PK' + Date.now().toString(36).toUpperCase();
    const now = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO orders (id, reference, userId, name, email, normalizedEmail, phone, items, total, shipping, paid, paymentMethod, status, statusHistory, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const hist = JSON.stringify([{status:'created', changedAt:now}]);
    stmt.run([id, ref, '1766668127650', 'sam', 'kuriamundus@gmail.com', 'kuriamundus@gmail.com', '+254700000000', JSON.stringify([{id:1,name:'X',price:100,quantity:1}]), 100, 0, 0, 'free', 'created', hist, now]);
    try { stmt.free(); } catch (e) {}
    await saveDB();
    console.log('Inserted order', id);

    // now delete as the user
    const token = jwt.sign({ id: '1766668127650', email: 'kuriamundus@gmail.com', name: 'sam' }, SECRET, { expiresIn: '7d' });
    const res = await fetch(`http://localhost:3000/api/orders/${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    const j = await res.json();
    console.log('delete status', res.status, j);

    // insert another and delete as admin
    const id2 = 't' + (Date.now()+1).toString(36);
    const stmt2 = db.prepare('INSERT INTO orders (id, reference, userId, name, email, normalizedEmail, phone, items, total, shipping, paid, paymentMethod, status, statusHistory, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    stmt2.run([id2, 'PK' + Date.now().toString(36).toUpperCase(), null, 'Other', 'other@example.com', 'other@example.com', '+254700000001', JSON.stringify([{id:1,name:'X',price:100,quantity:1}]), 100, 0, 0, 'free', 'created', hist, now]);
    try { stmt2.free(); } catch (e) {}
    await saveDB();
    console.log('Inserted admin-deletable order', id2);

    const adminToken = jwt.sign({ id: 'admin-test', email: 'admin@example.com', name: 'admin', role: 'admin' }, SECRET, { expiresIn: '7d' });
    const res2 = await fetch(`http://localhost:3000/api/orders/${id2}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + adminToken } });
    const j2 = await res2.json();
    console.log('admin delete status', res2.status, j2);

  } catch (e) { console.error(e); process.exit(1); }
})();
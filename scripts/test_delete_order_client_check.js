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

    const token = jwt.sign({ id: '1766668127650', email: 'kuriamundus@gmail.com', name: 'sam' }, SECRET, { expiresIn: '7d' });
    const res = await fetch(`http://localhost:3000/api/orders/${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    const txt = await res.text();
    console.log('delete status', res.status, 'body', txt.slice(0,400));

    const resDb = db.exec('SELECT id, reference FROM orders WHERE id = ' + JSON.stringify(id));
    const exists = (resDb?.[0]?.values || []).length > 0;
    console.log('exists after delete?', exists);

  } catch (e) { console.error(e); process.exit(1); }
})();
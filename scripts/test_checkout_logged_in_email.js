(async () => {
  try {
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
    const payload = { id: '1766668127650', email: 'kuriamundus@gmail.com', name: 'sam' };
    const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });

    // Attempt checkout with mismatched email
    const body = { name: 'sam', phone: '254700000000', email: 'wrong@example.com', paymentMethod: 'free', items: [{ id:1, name:'Test', price:100, quantity:1 }], subtotal:100, total:100 };
    const res = await fetch('http://localhost:3000/api/checkout', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    console.log('status', res.status);
    const j = await res.json(); console.log('body', j);

    // Attempt checkout without email field (should auto-fill)
    const body2 = { name: 'sam', phone: '254700000000', paymentMethod: 'free', items: [{ id:1, name:'Test', price:100, quantity:1 }], subtotal:100, total:100 };
    const res2 = await fetch('http://localhost:3000/api/checkout', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body2) });
    console.log('status2', res2.status); const j2 = await res2.json(); console.log('body2', j2);
  } catch (e) { console.error(e); process.exit(1); }
})();
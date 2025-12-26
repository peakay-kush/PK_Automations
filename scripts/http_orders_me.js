(async () => {
  try {
    const jwt = require('jsonwebtoken');
    const fetch = global.fetch || require('node-fetch');
    const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';
    // sam's user from DB
    const payload = { id: '1766668127650', email: 'kuriamundus@gmail.com', name: 'sam' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const res = await fetch('http://localhost:3005/api/orders/my/', { headers: { Authorization: 'Bearer ' + token } });
    console.log('status', res.status);
    const json = await res.json();
    console.log('body', json);
  } catch (e) { console.error(e); process.exit(1); }
})();
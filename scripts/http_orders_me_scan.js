(async () => {
  try {
    const jwt = require('jsonwebtoken');
    const fetch = global.fetch || require('node-fetch');
    const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';
    const payload = { id: '1766668127650', email: 'kuriamundus@gmail.com', name: 'sam' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    for (let port = 3000; port <= 3010; port++) {
      try {
        const url = `http://localhost:${port}/api/orders/my/`;
        const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, timeout: 2000 });
        console.log('port', port, 'status', res.status);
        const json = await res.json();
        console.log('body', JSON.stringify(json).slice(0, 2000));
      } catch (e) {
        console.log('port', port, 'error', String(e).split('\n')[0]);
      }
    }
  } catch (e) { console.error(e); process.exit(1); }
})();
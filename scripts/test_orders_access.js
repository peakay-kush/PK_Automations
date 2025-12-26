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
    const userPayload = { id: '1766668127650', email: 'kuriamundus@gmail.com', name: 'sam', role: 'user' };
    const adminPayload = { id: 'admin-test', email: 'admin@example.com', name: 'admin', role: 'admin' };

    const userToken = jwt.sign(userPayload, SECRET, { expiresIn: '7d' });
    const adminToken = jwt.sign(adminPayload, SECRET, { expiresIn: '7d' });

    const url = 'http://localhost:3000/api/orders/my/';
    const userRes = await fetch(url, { headers: { Authorization: 'Bearer ' + userToken } });
    const adminRes = await fetch(url, { headers: { Authorization: 'Bearer ' + adminToken } });
    const userJson = await userRes.json();
    const adminJson = await adminRes.json();

    console.log('user status', userRes.status, 'orders', Array.isArray(userJson.orders) ? userJson.orders.length : 'no orders array');
    console.log('admin status', adminRes.status, 'orders', Array.isArray(adminJson.orders) ? adminJson.orders.length : 'no orders array');

    if (userRes.status !== 200) throw new Error('User request failed');
    if (adminRes.status !== 200) throw new Error('Admin request failed');
    if (!Array.isArray(userJson.orders) || !Array.isArray(adminJson.orders)) throw new Error('Unexpected response data');
    if (adminJson.orders.length < userJson.orders.length) throw new Error('Admin returned fewer orders than user (unexpected)');

    console.log('Access test OK');
  } catch (e) { console.error('access test failed', e); process.exit(1); }
})();
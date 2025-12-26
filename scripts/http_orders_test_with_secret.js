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

    const ports = [3000,3001,3002,3005];
    for (const tokenInfo of [{label:'user', token: userToken}, {label:'admin', token: adminToken}]) {
      console.log('\nTesting token:', tokenInfo.label);
      for (const port of ports) {
        try {
          const url = `http://localhost:${port}/api/orders/my/`;
          const res = await fetch(url, { headers: { Authorization: 'Bearer ' + tokenInfo.token } , timeout: 3000});
          const json = await res.json();
          console.log('port', port, 'status', res.status, 'orders', Array.isArray(json.orders)? json.orders.length : JSON.stringify(json).slice(0,200));
        } catch (e) { console.log('port', port, 'error', String(e).split('\n')[0]); }
      }
    }
  } catch (e) { console.error(e); process.exit(1); }
})();
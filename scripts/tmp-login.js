const http = require('http');

function postJson(hostname, path, payload, bearer) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (bearer) headers['Authorization'] = 'Bearer ' + bearer;
    const opt = { hostname, port: 3000, path, method: 'POST', headers };
    const req = http.request(opt, (res) => {
      let b = '';
      res.on('data', (c) => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(data);
    req.end();
  });
}

(async () => {
  const email = 'pk.automations.ke@gmail.com';
  const password = 'pk@12345678';
  console.log('Attempting login for', email);
  const res = await postJson('127.0.0.1', '/api/auth/login', { email, password });
  console.log('login result:', res);
  if (res && res.status === 200) {
    try {
      const body = JSON.parse(res.body || '{}');
      if (body.token) {
        console.log('Token length:', body.token.length);
        const profile = await postJson('127.0.0.1', '/api/auth/profile', {}, body.token);
        console.log('profile result:', profile);
      } else {
        console.log('No token in login response');
      }
    } catch (e) {
      console.log('Error parsing login response', e.message);
    }
  }
})();

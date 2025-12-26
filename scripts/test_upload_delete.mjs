import fs from 'fs/promises';

const base = process.env.BASE || 'http://localhost:3002';
const email = process.env.TEST_ADMIN_EMAIL || 'pk.automations.ke@gmail.com';
const password = process.env.TEST_ADMIN_PASSWORD || 'A@12345678';

async function login() {
  const res = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const txt = await res.text();
  try { const json = JSON.parse(txt); if (!json || !json.token) throw new Error('Login failed: ' + txt); return json.token; } catch (e) { throw new Error('Login failed (non-json response): ' + txt); }
}

(async () => {
  try {
    console.log('Logging in...');
    const token = await login();
    console.log('Token acquired, uploading file...');
    const buf = await fs.readFile('public/favicon.ico');
    const file = new Blob([buf], { type: 'image/x-icon' });
    const fd = new FormData();
    fd.append('file', file, 'favicon.ico');

    const uploadRes = await fetch(`${base}/api/admin/uploads`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } });
    const upJson = await uploadRes.json();
    console.log('upload response', upJson);
    if (!upJson || !upJson.url) throw new Error('Upload failed');

    const url = upJson.url;
    console.log('Uploaded to', url);

    console.log('Attempting to delete the uploaded file...');
    const delRes = await fetch(`${base}/api/admin/uploads`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ url }) });
    const delJson = await delRes.json();
    console.log('delete response', delJson);

  } catch (err) {
    console.error('Test error', err);
    process.exit(1);
  }
})();
import fetch from 'node-fetch';

const base = process.env.BASE || 'http://localhost:3001';

async function login(email, password) {
  const res = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return res.json();
}

async function call(path, opts = {}) {
  const res = await fetch(`${base}${path}`, opts);
  const txt = await res.text();
  try { return { ok: res.ok, status: res.status, json: JSON.parse(txt) }; } catch (e) { return { ok: res.ok, status: res.status, text: txt }; }
}

(async () => {
  console.log('Logging in as peakay');
  const r = await login('pk.automations.ke@gmail.com', 'A@12345678');
  console.log('login', r);
  if (!r || !r.token) return console.error('login failed');
  const token = r.token;

  console.log('Create test user');
  const create = await call('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: 'admin-test@example.com', password: 'testpass', name: 'Admin Test' }) });
  console.log('create', create);

  // find id of test user
  const users = await call('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
  console.log('users count', users.json && users.json.length);
  const testUser = (users.json || []).find(u => u.email === 'admin-test@example.com');
  if (!testUser) return console.error('test user not found');

  console.log('Promote test user to admin');
  const promote = await call(`/api/admin/users/${testUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ role: 'admin' }) });
  console.log('promote', promote);

  console.log('Login as test user');
  const r2 = await login('admin-test@example.com', 'testpass');
  console.log('login test user', r2);
  const adminToken = r2.token;

  console.log('Admin (test user) create product');
  const createProd = await call('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ name: 'Test created by admin', category: 'DIY Kits', price: 1000 }) });
  console.log('createProd', createProd);
  const prodId = createProd.json && createProd.json.product && createProd.json.product.id;
  if (!prodId) return console.error('product not created');

  console.log('Admin (test user) delete product');
  const del = await call(`/api/admin/products/${prodId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  console.log('delete', del);

  console.log('Done');
})();
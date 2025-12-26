#!/usr/bin/env node
const bcrypt = require('bcryptjs');
(async () => {
  const email = process.env.SUPER_EMAIL || process.argv[2];
  const password = process.env.SUPER_PASSWORD || process.argv[3];
  const name = process.env.SUPER_NAME || process.argv[4] || 'Super Admin';

  if (!email || !password) {
    console.error('Usage: SUPER_EMAIL=... SUPER_PASSWORD=... node scripts/create-super.js OR node scripts/create-super.js email password [name]');
    process.exit(1);
  }

  // Dynamically import the ESM utils
  const dbModule = await import('../src/utils/db.js');
  const { getDB, saveDB } = dbModule;

  const db = await getDB();
  const res = db.exec('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (res.length > 0 && res[0].values.length > 0) {
    const userId = res[0].values[0][0];
    const hash = bcrypt.hashSync(password, 8);
    db.run('UPDATE users SET name = ?, password = ?, role = ? WHERE id = ?', [name, hash, 'super', userId]);
    console.log('Updated existing user as super:', email);
  } else {
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    const hash = bcrypt.hashSync(password, 8);
    db.run('INSERT INTO users (id, name, email, password, createdAt, role) VALUES (?, ?, ?, ?, ?, ?)', [id, name, email.toLowerCase(), hash, createdAt, 'super']);
    console.log('Created super user:', email);
  }
  await saveDB();
  process.exit(0);
})();

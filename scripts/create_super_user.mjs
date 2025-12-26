import bcrypt from 'bcryptjs';
import { getDB, saveDB } from '../src/utils/db.js';

function usage() {
  console.log('Usage:');
  console.log('  node scripts/create_super_user.mjs <email> <password> "Full Name"');
  console.log('Or set environment variables SUPER_EMAIL, SUPER_PASSWORD, SUPER_NAME');
}

(async () => {
  try {
    const argv = process.argv.slice(2);
    const env = process.env;
    const email = argv[0] || env.SUPER_EMAIL;
    const password = argv[1] || env.SUPER_PASSWORD;
    const name = argv[2] || env.SUPER_NAME || 'Administrator';

    if (!email || !password) {
      usage();
      process.exit(1);
    }

    const db = await getDB();
    const hash = bcrypt.hashSync(password, 8);
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();

    // remove any existing user with that email
    db.run('DELETE FROM users WHERE email = ?', [email.toLowerCase()]);

    db.run('INSERT INTO users (id, name, email, password, createdAt, role) VALUES (?, ?, ?, ?, ?, ?)', [id, name, email.toLowerCase(), hash, createdAt, 'super']);
    await saveDB();
    console.log('Created super user:', { id, email, name });
    console.log('You can now login at /login with the provided credentials');
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
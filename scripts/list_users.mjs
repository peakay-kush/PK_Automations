import { getDB } from '../src/utils/db.js';

(async () => {
  try {
    const db = await getDB();
    const res = db.exec('SELECT id, name, email, role, createdAt FROM users LIMIT 100');
    if (!res || !res[0] || !res[0].values || res[0].values.length === 0) {
      console.log('No users found or users table missing.');
      process.exit(0);
    }
    const rows = res[0].values.map(r => ({ id: r[0], name: r[1], email: r[2], role: r[3], createdAt: r[4] }));
    console.table(rows);
  } catch (e) {
    console.error('ERROR listing users:', e);
    process.exit(1);
  }
})();
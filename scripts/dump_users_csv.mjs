import fs from 'fs';
import path from 'path';
import { getDB } from '../src/utils/db.js';

(async () => {
  try {
    const db = await getDB();
    const res = db.exec('SELECT id, name, email, role, createdAt FROM users');
    if (!res || !res[0] || !res[0].values) {
      console.log('No users');
      process.exit(0);
    }
    const cols = res[0].columns;
    const rows = res[0].values;
    const out = [cols.join(',')]
      .concat(rows.map(r => r.map(v => (v === null ? '' : String(v).replace(/"/g, '""'))).map(v => `"${v}"`).join(','))).join('\n');
    const outPath = path.join(process.cwd(), 'data', 'users_dump.csv');
    fs.writeFileSync(outPath, out);
    console.log('Wrote CSV to', outPath);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
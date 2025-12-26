import fs from 'fs';
import path from 'path';
import { getDB } from '../src/utils/db.js';

(async () => {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'users.db');
    console.log('DB Path:', dbPath);
    if (!fs.existsSync(dbPath)) {
      console.log('DB file does not exist');
      process.exit(1);
    }
    const stat = fs.statSync(dbPath);
    console.log('Size:', stat.size, 'bytes');

    const buf = fs.readFileSync(dbPath, { length: 100 });
    const header = buf.toString('ascii', 0, 16);
    console.log('Header:', header);

    // Use SQL.js to inspect tables and rows
    const db = await getDB();
    const tablesRes = db.exec("SELECT name, type, sql FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%';");
    const tables = (tablesRes[0] && tablesRes[0].values) || [];
    if (tables.length === 0) {
      console.log('No tables found');
      process.exit(0);
    }
    console.log('Tables found:');
    for (const t of tables) {
      const name = t[0];
      console.log('-', name);
      try {
        const countRes = db.exec(`SELECT COUNT(*) as c FROM ${name}`);
        const cnt = (countRes[0] && countRes[0].values && countRes[0].values[0] && countRes[0].values[0][0]) || 0;
        console.log('  Rows:', cnt);
        if (cnt > 0) {
          const sample = db.exec(`SELECT * FROM ${name} LIMIT 5`);
          const cols = sample[0].columns;
          const vals = sample[0].values;
          console.log('  Columns:', cols.join(', '));
          console.table(vals.map(r => Object.fromEntries(r.map((v, i) => [cols[i], v]))));
        }
      } catch (e) {
        console.error('  Error reading table', e.message);
      }
    }

    // Optionally write an SQL dump (INSERTs)
    const dumpRows = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    let dumpSql = '';
    for (const row of (dumpRows[0]?.values || [])) {
      const table = row[0];
      const rows = db.exec(`SELECT * FROM ${table}`)[0];
      if (!rows) continue;
      const cols = rows.columns;
      for (const r of rows.values) {
        const vals = r.map(v => v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
        dumpSql += `INSERT INTO ${table} (${cols.join(',')}) VALUES (${vals.join(',')});\n`;
      }
    }
    if (dumpSql) {
      const outPath = path.join(process.cwd(), 'data', 'users_dump.sql');
      fs.writeFileSync(outPath, dumpSql);
      console.log('Wrote SQL dump to', outPath);
    } else {
      console.log('No data to dump');
    }

  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
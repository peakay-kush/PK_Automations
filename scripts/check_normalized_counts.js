(async () => {
  try {
    const { getDB } = require('../src/utils/db.js');
    const db = await getDB();
    const res = db.exec("SELECT COUNT(*) FROM orders WHERE normalizedEmail IS NULL OR normalizedEmail = ''");
    console.log('orders with null/empty normalizedEmail:', res?.[0]?.values?.[0]?.[0]);

    const stmt = db.prepare('SELECT id, reference, email, normalizedEmail FROM orders WHERE lower(email)=lower(?)');
    stmt.bind(['kuriamundus@gmail.com']);
    while (stmt.step()) {
       const r = stmt.get(); console.log('order for kuriamundus:', r);
    }
    try { stmt.free(); } catch (e) {}
  } catch (e) { console.error(e); process.exit(1); }
})();
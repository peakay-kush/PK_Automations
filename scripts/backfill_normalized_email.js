(async () => {
  try {
    const { getDB, saveDB } = require('../src/utils/db.js');
    const db = await getDB();
    const stmt = db.prepare('SELECT id, email, normalizedEmail FROM orders');
    const toUpdate = [];
    while (stmt.step()) {
      const r = stmt.get();
      const id = r[0];
      const email = r[1];
      const normalized = r[2];
      if (!normalized && email) toUpdate.push({ id, email });
    }
    try { stmt.free(); } catch (e) {}

    console.log('Found', toUpdate.length, 'orders to backfill');
    for (const u of toUpdate) {
      try {
        const upd = db.prepare('UPDATE orders SET normalizedEmail = lower(?) WHERE id = ?');
        upd.run([u.email, u.id]);
        try { upd.free(); } catch (e) {}
      } catch (e) { console.warn('update failed for', u.id, e); }
    }
    await saveDB();
    console.log('Backfill completed');
  } catch (e) { console.error('backfill error', e); process.exit(1); }
})();
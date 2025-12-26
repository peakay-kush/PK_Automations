(async () => {
  try {
    const { getDB } = require('../src/utils/db.js');
    const db = await getDB();

    // Find user named 'sam' or with 'sam' in email
    console.log('Searching users with name/email containing "sam"...');
    try {
      const stmt = db.prepare("SELECT id, name, email, createdAt FROM users WHERE lower(name) LIKE lower(?) OR lower(email) LIKE lower(?)");
      stmt.bind(['%sam%', '%sam%']);
      while (stmt.step()) {
        const r = stmt.get();
        console.log('USER:', { id: r[0], name: r[1], email: r[2], createdAt: r[3] });
      }
      try { stmt.free(); } catch (e) {}
    } catch (e) { console.warn('users query failed', e); }

    // Try to list orders for sam by userId or email
    console.log('\nSearching orders that might belong to sam (by userId or email)...');
    try {
      const res = db.exec("SELECT id, reference, userId, name, email, normalizedEmail, phone, items, total, paymentMethod, status, createdAt FROM orders ORDER BY createdAt DESC");
      const rows = res?.[0]?.values || [];
      for (const row of rows) {
        const [id, reference, userId, name, email, normalizedEmail, phone, items, total, paymentMethod, status, createdAt] = row;
        // crude matching heuristics
        if ((name && String(name).toLowerCase().includes('sam')) || (email && String(email).toLowerCase().includes('sam')) || (normalizedEmail && String(normalizedEmail).toLowerCase().includes('sam'))) {
          console.log('ORDER MATCH:', { id, reference, userId, name, email, normalizedEmail, phone, total, paymentMethod, status, createdAt });
        }
      }
    } catch (e) { console.warn('orders scan failed', e); }

    // Also print a summary of total orders for the user id(s) found
    try {
      const stmt2 = db.prepare('SELECT id, name, email FROM users WHERE lower(name) LIKE lower(?) OR lower(email) LIKE lower(?)');
      stmt2.bind(['%sam%', '%sam%']);
      const ids = [];
      while (stmt2.step()) {
        const r = stmt2.get(); ids.push({ id: r[0], name: r[1], email: r[2] });
      }
      try { stmt2.free(); } catch (e) {}
      for (const u of ids) {
        const stmt3 = db.prepare('SELECT id, reference, createdAt FROM orders WHERE userId = ? ORDER BY createdAt DESC');
        stmt3.bind([u.id]);
        const list = [];
        while (stmt3.step()) {
          const r = stmt3.get(); list.push({ id: r[0], reference: r[1], createdAt: r[2] });
        }
        try { stmt3.free(); } catch (e) {}
        console.log('\nOrders for user', u, '=>', list.length, 'items');
      }
    } catch (e) { console.warn('user->orders scan failed', e); }

  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
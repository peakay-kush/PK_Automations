let db = null;
let dbPath = null;

export async function initDB() {
  if (typeof window !== 'undefined') {
    throw new Error('initDB can only be called on the server');
  }
  if (db) return db;
  // Load sql.js using a runtime require when available to avoid bundling issues
  let initSqlJs;
  try {
    const runtimeRequire = (typeof globalThis.require === 'function' && globalThis.require) || eval('require');
    initSqlJs = runtimeRequire('sql.js');
  } catch (e) {
    const sqljsModule = await import('sql.js');
    initSqlJs = sqljsModule.default || sqljsModule;
  }
  const path = (await import('path')).default || (await import('path'));
  const fs = (await import('fs')).default || (await import('fs'));
  if (!dbPath) dbPath = path.join(process.cwd(), 'data', 'users.db');
  // initialize SQL.js and make sure locateFile points to the wasm in node_modules
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
  });
  let buffer = null;
  try {
    if (fs.existsSync(dbPath)) buffer = fs.readFileSync(dbPath);
  } catch (e) {}
  db = new SQL.Database(buffer);
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TEXT,
    role TEXT DEFAULT 'user'
  )`);

  // Orders table (for checkout history & payments)
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    reference TEXT,
    userId TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    items TEXT,
    total INTEGER,
    shipping INTEGER DEFAULT 0,
    paid INTEGER DEFAULT 0,
    paymentMethod TEXT,
    status TEXT,
    statusHistory TEXT,
    lastEmailError TEXT,
    lastMpesaUpdateError TEXT,
    mpesaMerchantRequestId TEXT,
    mpesaCheckoutRequestId TEXT,
    mpesa TEXT,
    createdAt TEXT
  )`);

  // Ensure shipping and shippingAddress/shippingLocation columns exist for older DBs
  try {
    const infoOrders = db.exec("PRAGMA table_info(orders);")[0]?.values || [];
    const orderCols = infoOrders.map((row) => row[1]);
    if (!orderCols.includes('shipping')) {
      try { db.run("ALTER TABLE orders ADD COLUMN shipping INTEGER DEFAULT 0"); } catch (e) {}
    }
    if (!orderCols.includes('shippingAddress')) {
      try { db.run("ALTER TABLE orders ADD COLUMN shippingAddress TEXT"); } catch (e) {}
    }
    if (!orderCols.includes('shippingLocation')) {
      try { db.run("ALTER TABLE orders ADD COLUMN shippingLocation TEXT"); } catch (e) {}
    }
    if (!orderCols.includes('statusHistory')) {
      try { db.run("ALTER TABLE orders ADD COLUMN statusHistory TEXT"); } catch (e) {}
    }
    if (!orderCols.includes('lastEmailError')) {
      try { db.run("ALTER TABLE orders ADD COLUMN lastEmailError TEXT"); } catch (e) {}
    }
    // Ensure mpesa-related columns exist for systems that will use Mpesa
    if (!orderCols.includes('mpesa')) {
      try { db.run("ALTER TABLE orders ADD COLUMN mpesa TEXT"); } catch (e) {}
    }
    if (!orderCols.includes('mpesaMerchantRequestId')) {
      try { db.run("ALTER TABLE orders ADD COLUMN mpesaMerchantRequestId TEXT"); } catch (e) {}
    }
    if (!orderCols.includes('mpesaCheckoutRequestId')) {
      try { db.run("ALTER TABLE orders ADD COLUMN mpesaCheckoutRequestId TEXT"); } catch (e) {}
    }
    if (!orderCols.includes('lastMpesaUpdateError')) {
      try { db.run("ALTER TABLE orders ADD COLUMN lastMpesaUpdateError TEXT"); } catch (e) {}
    }
    if (!orderCols.includes('normalizedEmail')) {
      try { db.run("ALTER TABLE orders ADD COLUMN normalizedEmail TEXT"); } catch (e) {}
    }
  } catch (e) {
    // ignore migration errors
  }

  // Migrate legacy src/data/orders.json if present (one-time)
  try {
    const ordersPath = path.join(process.cwd(), 'src', 'data', 'orders.json');
    if (fs.existsSync(ordersPath)) {
      const raw = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      const list = raw.orders || [];
      if (list.length > 0) {
        const stmt = db.prepare('INSERT OR IGNORE INTO orders (id, reference, userId, name, phone, email, items, total, paid, paymentMethod, status, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
        list.forEach((o) => {
          try {
            stmt.run([
              o.id || (Date.now().toString(36)),
              o.id || (Date.now().toString(36)),
              o.userId || null,
              o.name || '',
              o.phone || '',
              o.email || '',
              JSON.stringify(o.items || []),
              Number(o.total || 0),
              o.paid ? 1 : 0,
              o.paymentMethod || 'free',
              o.status || 'created',
              o.createdAt || new Date().toISOString(),
              /* mpesa removed */ null
            ]);
          } catch (e) {
            // ignore individual insert errors
            console.warn('order migration insert failed', e);
          }
        });
        try { stmt.free(); } catch (e) {}
        // move legacy file aside
        try { fs.renameSync(ordersPath, ordersPath + '.bak'); } catch (e) {}
      }
    }
  } catch (e) {
    // migration non-fatal
  }

  // Ensure role and profile-related columns exist for older DBs
  try {
    const info = db.exec("PRAGMA table_info(users);")[0]?.values || [];
    const cols = info.map((row) => row[1]);
    if (!cols.includes('role')) {
      db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
    }
    // Add optional contact/profile columns if missing
    if (!cols.includes('phone')) {
      try { db.run("ALTER TABLE users ADD COLUMN phone TEXT"); } catch (e) {}
    }
    if (!cols.includes('profileImage')) {
      try { db.run("ALTER TABLE users ADD COLUMN profileImage TEXT"); } catch (e) {}
    }
    if (!cols.includes('normalizedEmail')) {
      try { db.run("ALTER TABLE users ADD COLUMN normalizedEmail TEXT"); } catch (e) {}
    }
  } catch (e) {
    // ignore migration errors
  }

  // Restock subscriptions table
  try {
    db.run(`CREATE TABLE IF NOT EXISTS restock_subscriptions (
      id TEXT PRIMARY KEY,
      productId INTEGER,
      email TEXT,
      createdAt TEXT
    )`);
  } catch (e) {
    // ignore
  }

  // Ensure mpesa_queue table exists for recovery and retries if Mpesa is enabled
  try {
    db.run(`CREATE TABLE IF NOT EXISTS mpesa_queue (
      id TEXT PRIMARY KEY,
      orderId TEXT,
      payload TEXT,
      reason TEXT,
      attempts INTEGER DEFAULT 0,
      nextAttempt TEXT,
      createdAt TEXT,
      lastError TEXT
    )`);
  } catch (e) {
    console.warn('failed to ensure mpesa_queue table', e);
  }

  return db;
}

export async function saveDB() {
  if (typeof window !== 'undefined') {
    throw new Error('saveDB can only be called on the server');
  }
  if (!db) return;
  // Support both CommonJS and ESM runtimes
  let fs, path;
  try {
    // eslint-disable-next-line no-eval
    const req = eval('require');
    fs = req('fs');
    path = req('path');
  } catch (e) {
    const fsMod = await import('fs');
    const pathMod = await import('path');
    fs = fsMod.default || fsMod;
    path = pathMod.default || pathMod;
  }
  const dir = path.dirname(dbPath || path.join(process.cwd(), 'data', 'users.db'));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export async function getDB() {
  if (!db) await initDB();
  return db;
}

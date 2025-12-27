let db = null;
let dbPath = null;
let pgClient = null;
let dbMode = null; // 'sqljs' | 'pg'

export async function initDB() {
  if (typeof window !== 'undefined') {
    throw new Error('initDB can only be called on the server');
  }
  if (db) return db;
  
  try {
    // CRITICAL: Check for DATABASE_URL first, before any imports
    // In production (Vercel), DATABASE_URL MUST be set
    if (process.env.DATABASE_URL) {
      // Use Postgres in production
      return await initPgDB();
    }

    // Fallback to SQL.js only for local development
    // (if DATABASE_URL is not set)
    const [pathMod, fsMod] = await Promise.all([
      import('path'),
      import('fs')
    ]);
    const path = pathMod.default || pathMod;
    const fs = fsMod.default || fsMod;

    // Check if we're in a serverless environment without DATABASE_URL
    const isVercelOrLambda = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
    if (isVercelOrLambda) {
      throw new Error('Production serverless environment detected but DATABASE_URL is not set. Please configure DATABASE_URL in environment variables.');
    }

    // Fallback to SQL.js for local development only
    // (This code path should NOT execute in production)
    if (!dbPath) {
      dbPath = path.join(process.cwd(), 'data', 'users.db');
    }

    const initSqlJs = (await import('sql.js')).default;
    let SQL;
    try {
      SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
    } catch (e) {
      try {
        const wasmBinary = fs.readFileSync(path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'));
        SQL = await initSqlJs({ wasmBinary });
      } catch (e2) {
        console.error('[db] SQL.js init failed:', e2.message);
        throw new Error('Failed to initialize SQL.js');
      }
    }
    
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

    dbMode = 'sqljs';
    return db;
  } catch (err) {
    console.error('[db] initDB error:', err.message || err);
    throw err;
  }
}

async function initPgDB() {
  dbMode = 'pg';
  const pg = await import('pg');
  const { Client } = pg.default || pg;
  pgClient = new Client({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  await pgClient.connect();

  // Initialize tables
  await pgClient.query(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    normalizedEmail TEXT,
    password TEXT NOT NULL,
    phone TEXT,
    profileImage TEXT,
    createdAt TEXT,
    role TEXT DEFAULT 'user'
  )`);

  await pgClient.query(`CREATE TABLE IF NOT EXISTS orders (
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
    createdAt TEXT,
    shippingAddress TEXT,
    shippingLocation TEXT,
    normalizedEmail TEXT
  )`);

  await pgClient.query(`CREATE TABLE IF NOT EXISTS restock_subscriptions (
    id TEXT PRIMARY KEY,
    productId INTEGER,
    email TEXT,
    createdAt TEXT
  )`);

  await pgClient.query(`CREATE TABLE IF NOT EXISTS mpesa_queue (
    id TEXT PRIMARY KEY,
    orderId TEXT,
    payload TEXT,
    reason TEXT,
    attempts INTEGER DEFAULT 0,
    nextAttempt TEXT,
    createdAt TEXT,
    lastError TEXT
  )`);

  // Return a pg adapter implementing exec/run/prepare
  db = createPgAdapter();
  return db;
}

export async function saveDB() {
  if (typeof window !== 'undefined') {
    throw new Error('saveDB can only be called on the server');
  }
  if (!db) return;
  if (dbMode === 'pg') {
    // No-op: Postgres persists automatically
    return;
  }
  const fsMod = await import('fs');
  const pathMod = await import('path');
  const fs = fsMod.default || fsMod;
  const path = pathMod.default || pathMod;
  const dir = path.dirname(dbPath || path.join(process.cwd(), 'data', 'users.db'));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export async function getDB() {
  if (!db) await initDB();
  return db;
}

function toParamSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

function rowsToExecResult(rows) {
  if (!rows || rows.length === 0) return [{ columns: [], values: [] }];
  const columns = Object.keys(rows[0] || {});
  const values = rows.map(r => columns.map(c => r[c]));
  return [{ columns, values }];
}

function createPgAdapter() {
  return {
    exec: async (sql) => {
      const res = await pgClient.query(sql);
      return rowsToExecResult(res.rows);
    },
    run: async (sql, params = []) => {
      const q = toParamSql(sql);
      await pgClient.query(q, params);
    },
    prepare: (sql) => {
      let bound = [];
      let executed = null;
      return {
        bind(params) { bound = params || []; },
        async step() {
          const q = toParamSql(sql);
          const res = await pgClient.query(q, bound);
          executed = res.rows;
          return !!(executed && executed.length);
        },
        get() {
          if (!executed || executed.length === 0) return null;
          const row = executed[0];
          const cols = Object.keys(row);
          return cols.map(c => row[c]);
        },
        getAsObject() {
          if (!executed || executed.length === 0) return null;
          return executed[0];
        },
        async run(params = []) {
          const q = toParamSql(sql);
          await pgClient.query(q, params);
        },
        free() {}
      };
    }
  };
}

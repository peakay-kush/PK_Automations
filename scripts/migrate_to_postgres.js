#!/usr/bin/env node

/**
 * Migration script: SQL.js → PostgreSQL
 * 
 * Usage:
 *   1. Set DATABASE_URL in .env.local with your Neon/Postgres connection string
 *   2. Ensure local data/users.db exists (or /tmp/users.db in production)
 *   3. Run: npm run migrate:db
 * 
 * This will:
 *   - Read all data from SQL.js database
 *   - Connect to Postgres using DATABASE_URL
 *   - Insert all users, orders, restock_subscriptions, mpesa_queue rows
 *   - Report success/failure counts
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function migrate() {
  console.log('[migrate] Starting SQL.js → Postgres migration...\n');

  // 1. Load DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set in environment. Please add it to .env.local or set it before running.');
    process.exit(1);
  }

  // 2. Find SQL.js database file
  const dbPath = process.env.VERCEL || process.env.NODE_ENV === 'production'
    ? path.join('/tmp', 'users.db')
    : path.join(process.cwd(), 'data', 'users.db');

  if (!fs.existsSync(dbPath)) {
    console.log(`ℹ️  No SQL.js database found at ${dbPath}`);
    console.log('   Nothing to migrate. Tables will be created in Postgres if they don\'t exist.');
    process.exit(0);
  }

  console.log(`📂 SQL.js DB: ${dbPath}`);

  // 3. Initialize SQL.js
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const sqlDb = new SQL.Database(buffer);

  // 4. Connect to Postgres
  const pgClient = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  await pgClient.connect();
  console.log('✅ Connected to Postgres\n');

  // 5. Ensure tables exist in Postgres
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

  console.log('✅ Tables ensured in Postgres\n');

  // 6. Migrate users
  let usersCount = { migrated: 0, skipped: 0, failed: 0 };
  try {
    const usersRes = sqlDb.exec('SELECT * FROM users');
    if (usersRes[0]) {
      const { columns, values } = usersRes[0];
      console.log(`📊 Found ${values.length} users in SQL.js`);
      for (const row of values) {
        const user = {};
        columns.forEach((col, idx) => { user[col] = row[idx]; });
        try {
          await pgClient.query(
            `INSERT INTO users (id, name, email, normalizedEmail, password, phone, profileImage, createdAt, role) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             ON CONFLICT (id) DO NOTHING`,
            [
              user.id,
              user.name || null,
              user.email,
              user.normalizedEmail || user.email?.toLowerCase(),
              user.password,
              user.phone || null,
              user.profileImage || null,
              user.createdAt || new Date().toISOString(),
              user.role || 'user'
            ]
          );
          usersCount.migrated++;
        } catch (e) {
          if (e.code === '23505') { // unique violation
            usersCount.skipped++;
          } else {
            console.error(`   ❌ Failed to migrate user ${user.email}:`, e.message);
            usersCount.failed++;
          }
        }
      }
    }
  } catch (e) {
    console.log('   ℹ️  No users table or empty');
  }
  console.log(`   ✅ Migrated: ${usersCount.migrated} | Skipped: ${usersCount.skipped} | Failed: ${usersCount.failed}\n`);

  // 7. Migrate orders
  let ordersCount = { migrated: 0, skipped: 0, failed: 0 };
  try {
    const ordersRes = sqlDb.exec('SELECT * FROM orders');
    if (ordersRes[0]) {
      const { columns, values } = ordersRes[0];
      console.log(`📊 Found ${values.length} orders in SQL.js`);
      for (const row of values) {
        const order = {};
        columns.forEach((col, idx) => { order[col] = row[idx]; });
        try {
          await pgClient.query(
            `INSERT INTO orders (id, reference, userId, name, phone, email, items, total, shipping, paid, paymentMethod, status, statusHistory, lastEmailError, lastMpesaUpdateError, mpesaMerchantRequestId, mpesaCheckoutRequestId, mpesa, createdAt, shippingAddress, shippingLocation, normalizedEmail)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
             ON CONFLICT (id) DO NOTHING`,
            [
              order.id,
              order.reference || order.id,
              order.userId || null,
              order.name || null,
              order.phone || null,
              order.email || null,
              order.items || null,
              order.total || 0,
              order.shipping || 0,
              order.paid || 0,
              order.paymentMethod || null,
              order.status || 'created',
              order.statusHistory || null,
              order.lastEmailError || null,
              order.lastMpesaUpdateError || null,
              order.mpesaMerchantRequestId || null,
              order.mpesaCheckoutRequestId || null,
              order.mpesa || null,
              order.createdAt || new Date().toISOString(),
              order.shippingAddress || null,
              order.shippingLocation || null,
              order.normalizedEmail || order.email?.toLowerCase()
            ]
          );
          ordersCount.migrated++;
        } catch (e) {
          if (e.code === '23505') {
            ordersCount.skipped++;
          } else {
            console.error(`   ❌ Failed to migrate order ${order.id}:`, e.message);
            ordersCount.failed++;
          }
        }
      }
    }
  } catch (e) {
    console.log('   ℹ️  No orders table or empty');
  }
  console.log(`   ✅ Migrated: ${ordersCount.migrated} | Skipped: ${ordersCount.skipped} | Failed: ${ordersCount.failed}\n`);

  // 8. Migrate restock_subscriptions
  let restockCount = { migrated: 0, skipped: 0, failed: 0 };
  try {
    const restockRes = sqlDb.exec('SELECT * FROM restock_subscriptions');
    if (restockRes[0]) {
      const { columns, values } = restockRes[0];
      console.log(`📊 Found ${values.length} restock subscriptions in SQL.js`);
      for (const row of values) {
        const sub = {};
        columns.forEach((col, idx) => { sub[col] = row[idx]; });
        try {
          await pgClient.query(
            `INSERT INTO restock_subscriptions (id, productId, email, createdAt)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO NOTHING`,
            [sub.id, sub.productId, sub.email, sub.createdAt || new Date().toISOString()]
          );
          restockCount.migrated++;
        } catch (e) {
          if (e.code === '23505') {
            restockCount.skipped++;
          } else {
            console.error(`   ❌ Failed to migrate restock sub ${sub.id}:`, e.message);
            restockCount.failed++;
          }
        }
      }
    }
  } catch (e) {
    console.log('   ℹ️  No restock_subscriptions table or empty');
  }
  console.log(`   ✅ Migrated: ${restockCount.migrated} | Skipped: ${restockCount.skipped} | Failed: ${restockCount.failed}\n`);

  // 9. Migrate mpesa_queue
  let mpesaCount = { migrated: 0, skipped: 0, failed: 0 };
  try {
    const mpesaRes = sqlDb.exec('SELECT * FROM mpesa_queue');
    if (mpesaRes[0]) {
      const { columns, values } = mpesaRes[0];
      console.log(`📊 Found ${values.length} mpesa queue items in SQL.js`);
      for (const row of values) {
        const item = {};
        columns.forEach((col, idx) => { item[col] = row[idx]; });
        try {
          await pgClient.query(
            `INSERT INTO mpesa_queue (id, orderId, payload, reason, attempts, nextAttempt, createdAt, lastError)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            [
              item.id,
              item.orderId || null,
              item.payload || null,
              item.reason || null,
              item.attempts || 0,
              item.nextAttempt || null,
              item.createdAt || new Date().toISOString(),
              item.lastError || null
            ]
          );
          mpesaCount.migrated++;
        } catch (e) {
          if (e.code === '23505') {
            mpesaCount.skipped++;
          } else {
            console.error(`   ❌ Failed to migrate mpesa queue ${item.id}:`, e.message);
            mpesaCount.failed++;
          }
        }
      }
    }
  } catch (e) {
    console.log('   ℹ️  No mpesa_queue table or empty');
  }
  console.log(`   ✅ Migrated: ${mpesaCount.migrated} | Skipped: ${mpesaCount.skipped} | Failed: ${mpesaCount.failed}\n`);

  // 10. Close connections
  sqlDb.close();
  await pgClient.end();

  console.log('🎉 Migration complete!\n');
  console.log('Summary:');
  console.log(`  Users: ${usersCount.migrated} migrated, ${usersCount.skipped} skipped, ${usersCount.failed} failed`);
  console.log(`  Orders: ${ordersCount.migrated} migrated, ${ordersCount.skipped} skipped, ${ordersCount.failed} failed`);
  console.log(`  Restock: ${restockCount.migrated} migrated, ${restockCount.skipped} skipped, ${restockCount.failed} failed`);
  console.log(`  Mpesa Queue: ${mpesaCount.migrated} migrated, ${mpesaCount.skipped} skipped, ${mpesaCount.failed} failed`);
}

migrate().catch(err => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});

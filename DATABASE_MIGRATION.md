# Database Migration to PostgreSQL

## Overview

The application now supports both **SQL.js** (local/dev) and **PostgreSQL** (production) databases. When `DATABASE_URL` environment variable is set, the app automatically uses Postgres. Otherwise, it falls back to SQL.js.

---

## Quick Start (Production)

### 1. Set Environment Variable

In **Vercel Dashboard** → Your Project → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

For **Neon**, the format is:
```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 2. Redeploy

Vercel will automatically use Postgres on the next deployment. Tables will be created automatically on first app startup.

### 3. (Optional) Migrate Existing Data

If you have existing users/orders in SQL.js (`/tmp/users.db` or `data/users.db`), run the migration script **locally**:

```bash
# Ensure DATABASE_URL is in .env.local
npm run migrate:db
```

This will copy all data from SQL.js to Postgres (users, orders, restock subscriptions, mpesa queue).

---

## Local Development

### Use SQL.js (Default)

**No DATABASE_URL set** → SQL.js file-backed DB at `data/users.db`

```bash
npm run dev
```

### Use Postgres (Test Production Setup)

Add to `.env.local`:
```
DATABASE_URL=postgresql://localhost:5432/pkautomations
```

Then:
```bash
npm run dev
```

---

## Migration Details

### What the Migration Script Does

- Reads all tables from SQL.js database
- Connects to Postgres using `DATABASE_URL`
- Inserts rows with `ON CONFLICT DO NOTHING` (skips duplicates)
- Reports: migrated, skipped, failed counts

### Tables Migrated

1. **users** - All user accounts with normalized emails
2. **orders** - Order history with payment/shipping details
3. **restock_subscriptions** - Product restock notifications
4. **mpesa_queue** - Mpesa payment retry queue

### Run Migration

```bash
# Set DATABASE_URL in .env.local first
npm run migrate:db
```

**Output Example:**
```
[migrate] Starting SQL.js → Postgres migration...

📂 SQL.js DB: /path/to/data/users.db
✅ Connected to Postgres

✅ Tables ensured in Postgres

📊 Found 15 users in SQL.js
   ✅ Migrated: 15 | Skipped: 0 | Failed: 0

📊 Found 42 orders in SQL.js
   ✅ Migrated: 42 | Skipped: 0 | Failed: 0

🎉 Migration complete!
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  normalizedEmail TEXT,
  password TEXT NOT NULL,
  phone TEXT,
  profileImage TEXT,
  createdAt TEXT,
  role TEXT DEFAULT 'user'
);
```

### Orders Table

```sql
CREATE TABLE orders (
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
);
```

### Restock Subscriptions Table

```sql
CREATE TABLE restock_subscriptions (
  id TEXT PRIMARY KEY,
  productId INTEGER,
  email TEXT,
  createdAt TEXT
);
```

### Mpesa Queue Table

```sql
CREATE TABLE mpesa_queue (
  id TEXT PRIMARY KEY,
  orderId TEXT,
  payload TEXT,
  reason TEXT,
  attempts INTEGER DEFAULT 0,
  nextAttempt TEXT,
  createdAt TEXT,
  lastError TEXT
);
```

---

## Troubleshooting

### "ECONNREFUSED" when connecting to Postgres

- Check `DATABASE_URL` format
- Verify database host is reachable
- For Neon: ensure `sslmode=require` is in connection string

### Migration says "No SQL.js database found"

- If you have no local users/orders yet, this is normal
- Migration is only needed if you have existing data in SQL.js

### "pg" module not found

Run:
```bash
npm install
```

### Tables already exist with different schema

Drop and recreate in Postgres (WARNING: deletes all data):

```bash
psql $DATABASE_URL -c "DROP TABLE users, orders, restock_subscriptions, mpesa_queue CASCADE;"
```

Then restart the app to auto-create fresh tables.

---

## How It Works

### Automatic Database Selection

In `src/utils/db.js`:

1. **Check for `DATABASE_URL`** → Use Postgres
2. **No `DATABASE_URL`** → Use SQL.js

### Postgres Adapter

The `createPgAdapter()` function in `db.js` wraps the `pg` client to match SQL.js API:

- `db.exec(sql)` → Raw query, returns `[{ columns, values }]`
- `db.run(sql, params)` → Parameterized insert/update/delete
- `db.prepare(sql)` → Returns statement with `.bind()`, `.step()`, `.get()`, `.getAsObject()`

This means **existing route handlers don't need changes**—they call the same methods whether using SQL.js or Postgres.

### Parameter Conversion

SQL.js uses `?` placeholders, Postgres uses `$1, $2, ...`. The adapter converts automatically:

```javascript
// Route code (unchanged)
db.run('INSERT INTO users VALUES (?, ?, ?)', [id, name, email])

// Adapter converts to:
pgClient.query('INSERT INTO users VALUES ($1, $2, $3)', [id, name, email])
```

---

## Production Checklist

- [x] Add `DATABASE_URL` to Vercel environment variables
- [x] Redeploy app (tables auto-create on first request)
- [ ] Run migration if you have existing SQL.js data: `npm run migrate:db`
- [ ] Test auth: register, login, profile update
- [ ] Test orders: create order, check order status
- [ ] Verify data persists across deployments

---

## Next Steps

- **Backups**: Neon provides automatic backups; enable them in Neon dashboard
- **Indexing**: Add indexes for common queries (e.g., `CREATE INDEX idx_orders_user ON orders(userId)`)
- **Monitoring**: Use Neon's query analytics to track slow queries
- **Connection Pooling**: For high traffic, use PgBouncer or Neon's built-in pooling

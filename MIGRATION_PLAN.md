# Postgres Migration Plan

Goal: Move from SQL.js (file-backed SQLite) to a managed Postgres instance for production reliability.

Outline:
1. Schema discovery
   - Inspect SQL.js schema using a node script or sqlite tools to extract `CREATE TABLE` statements.
   - Map SQLite types to Postgres types (TEXT -> TEXT, INTEGER -> INTEGER, REAL -> REAL, etc.)

2. Provision Postgres
   - Add `postgres` service to `docker-compose.yml` for staging/tests or provision managed Postgres (e.g., Supabase, AWS RDS)
   - Add connection env vars: `POSTGRES_URL` or `PGHOST/PGUSER/PGPASSWORD/PGDATABASE`

3. Migration strategy (recommended)
   - Export current SQL.js data to JSON or CSV by table.
   - Write a migration script `scripts/migrate_to_postgres.js` that:
     - Reads data/users.db (sql.js) and extracts rows per table
     - Connects to Postgres using `pg` and recreates tables
     - Inserts rows in batches inside a transaction

4. Backups & verification
   - Before migration, take a backup: `scripts/backup_db.js` (copies `data/users.db` to `backups/` with timestamp)
   - After migration, validate counts and spot-check rows

5. Cutover
   - Switch application `DB` config to use Postgres env var
   - Deploy change to staging and run E2E tests
   - When verified, switch production after scheduling maintenance window

6. Post-migration
   - Remove write access to SQL.js file (or archive it)
   - Add periodic Postgres backups and retention policy (daily snapshots + weekly offsite)

Notes & Considerations
- SQL.js may use JSON blobs for complex fields (e.g., `statusHistory`); ensure JSON is handled correctly when inserting into Postgres (use JSON/JSONB columns where applicable).
- Consider using a minimal ORM or a set of parameterized inserts to avoid SQL injection and ensure correctness.
- Implement a reversible migration and keep migration scripts in `scripts/` with clear README so the team can re-run if necessary.

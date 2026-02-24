require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log('Running migrations...')

  await sql`CREATE TABLE IF NOT EXISTS organizations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`

  await sql`CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone_number  TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`

  await sql`CREATE TABLE IF NOT EXISTS api_keys (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key_hash     TEXT NOT NULL UNIQUE,
    key_prefix   TEXT NOT NULL,
    machine_name TEXT NOT NULL DEFAULT 'default',
    last_seen    TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`

  await sql`CREATE TABLE IF NOT EXISTS alerts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    machine_name TEXT NOT NULL DEFAULT 'unknown',
    alert_id     TEXT,
    rule_id      TEXT NOT NULL,
    rule_name    TEXT NOT NULL,
    severity     TEXT NOT NULL,
    confidence   FLOAT,
    description  TEXT NOT NULL,
    pid          INTEGER,
    ppid         INTEGER,
    uid          INTEGER,
    new_uid      INTEGER,
    comm         TEXT,
    parent_comm  TEXT,
    syscall      TEXT,
    filename     TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by TEXT,
    raw_timestamp BIGINT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`

  await sql`CREATE TABLE IF NOT EXISTS otp_codes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code       TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`

  await sql`CREATE INDEX IF NOT EXISTS idx_alerts_org_id     ON alerts(org_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_alerts_severity   ON alerts(severity)`
  await sql`CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_hash     ON api_keys(key_hash)`

  console.log('✅ Migration complete')
  process.exit(0)
}

migrate().catch(e => { console.error(e); process.exit(1) })

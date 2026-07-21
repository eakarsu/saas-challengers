const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const migrationDir = path.join(__dirname, 'migrations');

async function migrate({ checkOnly = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(73421001)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const files = fs.readdirSync(migrationDir).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
    const applied = new Map((await client.query('SELECT name, checksum FROM schema_migrations')).rows.map((row) => [row.name, row.checksum]));
    const pending = [];
    for (const name of files) {
      const sql = fs.readFileSync(path.join(migrationDir, name), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      if (applied.has(name)) {
        if (applied.get(name) !== checksum) throw new Error(`Applied migration checksum mismatch: ${name}`);
      } else pending.push({ name, sql, checksum });
    }
    if (checkOnly) {
      if (pending.length) throw new Error(`Pending migrations: ${pending.map((item) => item.name).join(', ')}`);
      return { applied: files.length, pending: 0 };
    }
    for (const item of pending) {
      await client.query('BEGIN');
      try {
        await client.query(item.sql);
        await client.query('INSERT INTO schema_migrations(name, checksum) VALUES($1,$2)', [item.name, item.checksum]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    return { applied: files.length, newlyApplied: pending.length };
  } finally {
    await client.query('SELECT pg_advisory_unlock(73421001)').catch(() => {});
    client.release();
  }
}

if (require.main === module) {
  migrate({ checkOnly: process.argv.includes('--check') })
    .then((result) => { console.log(`Migration status: ${JSON.stringify(result)}`); })
    .catch((error) => { console.error(error.message); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = migrate;

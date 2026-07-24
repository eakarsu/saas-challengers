#!/usr/bin/env node
const bcrypt = require('bcrypt');
const pool = require('../db');

const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.PROVISION_ADMIN_PASSWORD || '';
const name = String(process.env.BOOTSTRAP_ADMIN_NAME || process.env.PROVISION_ADMIN_NAME || 'Research Administrator').trim();
const organizationName = String(process.env.BOOTSTRAP_TENANT_NAME || 'Runtime Acceptance Organization').trim();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address');
if (password.length < 12 || password.length > 72 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
  throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain 12-72 characters with upper-case, lower-case, and numeric characters');
}
if (name.length < 2 || name.length > 120 || organizationName.length < 2 || organizationName.length > 160) {
  throw new Error('Bootstrap names are outside their allowed bounds');
}

async function createAdmin() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('saas-challengers-admin-bootstrap'))");
    let user = (await client.query('SELECT id FROM users WHERE email=$1', [email])).rows[0];
    if (!user) {
      user = (await client.query(
        'INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) RETURNING id',
        [email, await bcrypt.hash(password, 12), name],
      )).rows[0];
    } else {
      await client.query('UPDATE users SET password_hash=$1,name=$2,is_active=TRUE WHERE id=$3', [await bcrypt.hash(password, 12), name, user.id]);
    }
    let organization = (await client.query(
      'SELECT o.id FROM organizations o JOIN organization_members m ON m.organization_id=o.id WHERE m.user_id=$1 AND m.role=$2 LIMIT 1',
      [user.id, 'ADMIN'],
    )).rows[0];
    if (!organization) {
      organization = (await client.query(
        'INSERT INTO organizations(name,created_by) VALUES($1,$2) RETURNING id',
        [organizationName, user.id],
      )).rows[0];
      await client.query(
        "INSERT INTO organization_members(organization_id,user_id,role) VALUES($1,$2,'ADMIN')",
        [organization.id, user.id],
      );
    }
    await client.query('COMMIT');
    console.log(`Administrator identity is ready for ${email}`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

createAdmin()
  .catch((error) => {
    console.error(`Administrator bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

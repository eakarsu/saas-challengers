const crypto = require('crypto');
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');
const { AppError } = require('../lib/errors');
const { objectBody, text, email, password } = require('../lib/validation');
const { appendAudit } = require('../services/audit');

function accessToken(userId) {
  return jwt.sign({ userId, type: 'access' }, config.jwtSecret, { algorithm: 'HS256', expiresIn: config.jwtExpiresIn });
}

async function memberships(client, userId) {
  return (await client.query(`SELECT o.id, o.name, om.role FROM organization_members om JOIN organizations o ON o.id=om.organization_id WHERE om.user_id=$1 AND om.is_active=TRUE ORDER BY o.name`, [userId])).rows;
}

router.post('/register', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const input = objectBody(req);
    const normalizedEmail = email(input.email);
    const cleanName = text(input.name, 'name', { min: 2, max: 120 });
    const cleanPassword = password(input.password);
    const invitationToken = typeof input.invitationToken === 'string' ? input.invitationToken.trim() : '';
    const organizationName = invitationToken ? '' : text(input.organizationName, 'organizationName', { min: 2, max: 160 });
    const passwordHash = await bcrypt.hash(cleanPassword, 12);
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    let invitation;
    if (invitationToken) {
      const tokenHash = crypto.createHash('sha256').update(invitationToken).digest('hex');
      invitation = (await client.query(`SELECT * FROM organization_invitations WHERE token_hash=$1 FOR UPDATE`, [tokenHash])).rows[0];
      if (!invitation || invitation.used_at || new Date(invitation.expires_at) <= new Date() || invitation.email !== normalizedEmail) throw new AppError('Invitation is invalid or expired', 403, 'INVITATION_INVALID');
    }
    let user;
    try {
      user = (await client.query('INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) RETURNING id,email,name', [normalizedEmail, passwordHash, cleanName])).rows[0];
    } catch (error) {
      if (error.code === '23505') throw new AppError('Account cannot be created', 409, 'ACCOUNT_CONFLICT');
      throw error;
    }
    if (invitation) {
      await client.query('INSERT INTO organization_members(organization_id,user_id,role) VALUES($1,$2,$3)', [invitation.organization_id, user.id, invitation.role]);
      await client.query('UPDATE organization_invitations SET used_at=NOW(), used_by=$1 WHERE id=$2', [user.id, invitation.id]);
      await appendAudit(client, { organizationId: invitation.organization_id, actorId: user.id, action: 'MEMBER_JOINED', resourceType: 'OrganizationMember', resourceId: user.id, outcome: 'SUCCESS', metadata: { role: invitation.role } });
    } else {
      const organization = (await client.query('INSERT INTO organizations(name,created_by) VALUES($1,$2) RETURNING id', [organizationName, user.id])).rows[0];
      await client.query(`INSERT INTO organization_members(organization_id,user_id,role) VALUES($1,$2,'ADMIN')`, [organization.id, user.id]);
      await appendAudit(client, { organizationId: organization.id, actorId: user.id, action: 'ORGANIZATION_CREATED', resourceType: 'Organization', resourceId: organization.id, outcome: 'SUCCESS', metadata: { name: organizationName } });
    }
    const organizations = await memberships(client, user.id);
    await client.query('COMMIT');
    res.status(201).json({ token: accessToken(user.id), user, organizations });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally { client.release(); }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = objectBody(req);
    const normalizedEmail = email(input.email);
    const candidate = typeof input.password === 'string' ? input.password : '';
    const { rows } = await pool.query('SELECT id,email,name,password_hash FROM users WHERE email=$1 AND is_active=TRUE', [normalizedEmail]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(candidate, user.password_hash))) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    const organizations = await memberships(pool, user.id);
    if (!organizations.length) throw new AppError('Account has no active organization', 403, 'ACCOUNT_NOT_PROVISIONED');
    res.json({ token: accessToken(user.id), user: { id: user.id, email: user.email, name: user.name }, organizations });
  } catch (error) { next(error); }
});

router.get('/session', async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new AppError('Access token required', 401, 'AUTH_REQUIRED');
    const payload = jwt.verify(header.slice(7), config.jwtSecret, { algorithms: ['HS256'] });
    if (payload.type !== 'access' || !Number.isInteger(payload.userId)) throw new AppError('Access token invalid', 401, 'AUTH_INVALID');
    const { rows } = await pool.query('SELECT id,email,name FROM users WHERE id=$1 AND is_active=TRUE', [payload.userId]);
    if (!rows[0]) throw new AppError('Access token invalid', 401, 'AUTH_INVALID');
    const organizations = await memberships(pool, rows[0].id);
    if (!organizations.length) throw new AppError('Account has no active organization', 403, 'ACCOUNT_NOT_PROVISIONED');
    res.set('Cache-Control', 'no-store').json({ user: rows[0], organizations });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return next(new AppError('Access token invalid', 401, 'AUTH_INVALID'));
    return next(error);
  }
});

module.exports = router;

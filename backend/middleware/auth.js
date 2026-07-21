const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');
const { AppError } = require('../lib/errors');

async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new AppError('Access token required', 401, 'AUTH_REQUIRED');
    const payload = jwt.verify(header.slice(7), config.jwtSecret, { algorithms: ['HS256'] });
    if (payload.type !== 'access' || !Number.isInteger(payload.userId)) throw new AppError('Access token invalid', 401, 'AUTH_INVALID');
    const organizationId = Number(req.headers['x-organization-id']);
    if (!Number.isInteger(organizationId) || organizationId < 1) throw new AppError('X-Organization-ID is required', 400, 'ORGANIZATION_REQUIRED');
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.name, om.organization_id, om.role
       FROM users u JOIN organization_members om ON om.user_id=u.id
       WHERE u.id=$1 AND u.is_active=TRUE AND om.organization_id=$2 AND om.is_active=TRUE`,
      [payload.userId, organizationId],
    );
    if (!rows[0]) throw new AppError('Organization membership not found', 403, 'TENANT_FORBIDDEN');
    req.actor = rows[0];
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return next(new AppError('Access token invalid', 401, 'AUTH_INVALID'));
    next(error);
  }
}

function authorize(...roles) {
  return (req, _res, next) => req.actor && roles.includes(req.actor.role) ? next() : next(new AppError('Role is not permitted', 403, 'ROLE_FORBIDDEN'));
}

module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.authorize = authorize;

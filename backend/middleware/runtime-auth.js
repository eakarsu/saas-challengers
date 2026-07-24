const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');
const { AppError } = require('../lib/errors');
module.exports = async function runtimeAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new AppError('Access token required', 401, 'AUTH_REQUIRED');
    const payload = jwt.verify(header.slice(7), config.jwtSecret, { algorithms: ['HS256'] });
    if (payload.type !== 'access' || !Number.isInteger(payload.userId)) throw new AppError('Access token invalid', 401, 'AUTH_INVALID');
    const { rows } = await pool.query(`SELECT u.id,u.email,u.name,om.organization_id,om.role FROM users u JOIN organization_members om ON om.user_id=u.id WHERE u.id=$1 AND u.is_active=TRUE AND om.is_active=TRUE ORDER BY om.organization_id LIMIT 1`, [payload.userId]);
    if (!rows[0]) throw new AppError('Account has no active organization', 403, 'ACCOUNT_NOT_PROVISIONED');
    req.actor = rows[0]; next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return next(new AppError('Access token invalid', 401, 'AUTH_INVALID'));
    next(error);
  }
};

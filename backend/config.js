const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function required(name, minimum = 1) {
  const value = process.env[name] || '';
  if (value.length < minimum) throw new Error(`${name} must be configured with at least ${minimum} characters`);
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const trustProxyValue = process.env.TRUST_PROXY || 'false';
if (!['true', 'false'].includes(trustProxyValue)) throw new Error('TRUST_PROXY must be true or false');
const config = {
  nodeEnv,
  port: Number(process.env.PORT || 3012),
  host: process.env.HOST || '127.0.0.1',
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET', 32),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://127.0.0.1:5176').split(',').map((value) => value.trim()).filter(Boolean),
  frontendDist: process.env.FRONTEND_DIST || '',
  trustProxy: trustProxyValue === 'true',
};

if (!Number.isInteger(config.port) || config.port < 1024 || config.port > 65535) throw new Error('PORT must be an unprivileged TCP port');
if (!['127.0.0.1', '0.0.0.0'].includes(config.host)) throw new Error('HOST must be 127.0.0.1 or 0.0.0.0');
if (!config.databaseUrl.startsWith('postgresql://') && !config.databaseUrl.startsWith('postgres://')) throw new Error('DATABASE_URL must use PostgreSQL');
if (/(?:replace[-_ ]?me|generate[-_ ]?(?:a|an)|change[-_ ]?me|changeme|example[-_ ]?secret)/i.test(config.jwtSecret)) {
  throw new Error('JWT_SECRET must be generated and cannot use an example placeholder');
}
if (/(?:replace[-_ ]?me|change[-_ ]?me|changeme)/i.test(config.databaseUrl)) {
  throw new Error('DATABASE_URL cannot contain an example placeholder');
}

module.exports = config;

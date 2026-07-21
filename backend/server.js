const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const config = require('./config');
const pool = require('./db');
const { AppError } = require('./lib/errors');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] && /^[A-Za-z0-9._:-]{8,100}$/.test(req.headers['x-request-id']) ? req.headers['x-request-id'] : crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  const started = Date.now();
  res.on('finish', () => console.log(JSON.stringify({ level: 'info', event: 'http_request', requestId: req.requestId, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - started })));
  next();
});
app.use(helmet({ contentSecurityPolicy: config.frontendDist ? undefined : false }));
app.use(cors({
  credentials: false,
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
    callback(new AppError('Origin is not allowed', 403, 'CORS_FORBIDDEN'));
  },
}));
app.use(express.json({ limit: '256kb', strict: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: config.nodeEnv === 'test' ? 1000 : 20, standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/research', require('./routes/research'));

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.set('Cache-Control', 'no-store').json({ status: 'ok', database: 'reachable', service: 'governed-research', timestamp: new Date().toISOString() });
  } catch (error) { next(new AppError('Database is unavailable', 503, 'DATABASE_UNAVAILABLE')); }
});

app.use('/api', (_req, _res, next) => next(new AppError('API route not found', 404, 'NOT_FOUND')));

if (config.frontendDist && fs.existsSync(config.frontendDist)) {
  app.use(express.static(config.frontendDist, { index: false, maxAge: config.nodeEnv === 'production' ? '1h' : 0 }));
  app.get('*', (_req, res) => res.sendFile(path.join(config.frontendDist, 'index.html')));
}

app.use((error, req, res, _next) => {
  const status = error.status || (error.type === 'entity.too.large' ? 413 : 500);
  const code = error.code && typeof error.code === 'string' && !/^\d+$/.test(error.code) ? error.code : status === 413 ? 'BODY_TOO_LARGE' : 'INTERNAL_ERROR';
  if (status >= 500) console.error(JSON.stringify({ level: 'error', event: 'request_failed', requestId: req.requestId, code, message: error.message }));
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message, code, requestId: req.requestId });
});

let server;
if (require.main === module) {
  server = app.listen(config.port, config.host, () => console.log(JSON.stringify({ level: 'info', event: 'server_started', host: config.host, port: config.port })));
  const shutdown = (signal) => {
    console.log(JSON.stringify({ level: 'info', event: 'shutdown_started', signal }));
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;

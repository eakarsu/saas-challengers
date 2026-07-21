const { Pool } = require('pg');
const config = require('./config');
const pool = new Pool({ connectionString: config.databaseUrl, max: Number(process.env.DB_POOL_MAX || 10), idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
module.exports = pool;

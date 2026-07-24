'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'apex_banking',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT, 10) || 15,
  queueLimit: 0,
  timezone: '+00:00'
});

module.exports = pool;
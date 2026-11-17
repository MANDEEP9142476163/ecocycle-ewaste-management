const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

let poolConfig = {};

if (dbUrl) {
  try {
    const parsed = new URL(dbUrl);
    poolConfig = {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'railway',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      dateStrings: true,
      ssl: { rejectUnauthorized: false }
    };
    console.log(`[DB Config] Using connection URL to ${parsed.hostname}:${poolConfig.port}/${poolConfig.database}`);
  } catch (err) {
    console.warn('[DB Config] Failed to parse URL, using uri string directly:', err.message);
    poolConfig = {
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      dateStrings: true,
      ssl: { rejectUnauthorized: false }
    };
  }
} else {
  const host = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
  const user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'ewaste_management';

  const isRemote = host !== '127.0.0.1' && host !== 'localhost';

  poolConfig = {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined
  };
  console.log(`[DB Config] Using host=${host}, port=${port}, user=${user}, database=${database}, ssl=${!!isRemote}`);
}

const pool = mysql.createPool(poolConfig);

// Test connection helper
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[DB] Connected to MySQL database successfully.`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[DB] Connection error:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};

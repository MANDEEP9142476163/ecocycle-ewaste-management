const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ewaste_management',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true
});

// Test connection helper
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[DB] Connected to MySQL database "${process.env.DB_NAME || 'ewaste_management'}" successfully.`);
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

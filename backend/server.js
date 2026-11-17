const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { testConnection, pool } = require('./config/db');
const { autoMigrate } = require('./database/autoMigrate');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS - configured to permit Vercel and local origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://ecocycle-ewaste-management.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/pages', require('./routes/pageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check endpoint with diagnostic database status
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  let tables = [];
  try {
    const [rows] = await pool.query('SHOW TABLES');
    dbStatus = 'connected';
    tables = rows.map(r => Object.values(r)[0]);
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
  }

  res.json({
    status: 'online',
    service: 'EcoCycle Smart E-Waste Management API',
    database: {
      status: dbStatus,
      tablesCount: tables.length,
      tables: tables.slice(0, 15),
      error: dbError
    },
    env: {
      has_DB_HOST: !!process.env.DB_HOST,
      has_MYSQLHOST: !!process.env.MYSQLHOST,
      has_DATABASE_URL: !!process.env.DATABASE_URL,
      has_MYSQL_URL: !!process.env.MYSQL_URL,
      node_env: process.env.NODE_ENV || 'development'
    },
    timestamp: new Date().toISOString()
  });
});

// Safe database setup / auto-migration endpoint
app.post('/api/setup-database', async (req, res) => {
  try {
    const result = await autoMigrate();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Fallback 404 for undefined API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Requested API endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Server Error]:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

// Start Server
async function startServer() {
  const dbOk = await testConnection();
  if (dbOk) {
    // Automatically verify schema and run safe migration
    await autoMigrate();
  } else {
    console.warn('[Warning] Database connection failed on startup. Please ensure MySQL is reachable.');
  }

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🌱 EcoCycle API Server running on port ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}`);
    console.log(`📦 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

startServer();

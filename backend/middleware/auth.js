const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid token format.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ecocycle_super_secure_jwt_secret_key_2026_sai_iii');
    
    // Check user existence according to role
    if (decoded.role === 'admin') {
      const [rows] = await pool.query('SELECT id, admin_name, username, email, mobile_number FROM admins WHERE id = ?', [decoded.id]);
      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Admin account not found.' });
      }
      req.user = { ...rows[0], role: 'admin', name: rows[0].admin_name };
    } else if (decoded.role === 'employee') {
      const [rows] = await pool.query('SELECT id, employee_code, name, email, contact_number, status FROM employees WHERE id = ?', [decoded.id]);
      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Employee account not found.' });
      }
      if (rows[0].status !== 'Active') {
        return res.status(403).json({ success: false, message: 'Employee account is deactivated. Contact administrator.' });
      }
      req.user = { ...rows[0], role: 'employee' };
    } else if (decoded.role === 'user') {
      const [rows] = await pool.query('SELECT id, full_name, email, mobile_number FROM users WHERE id = ?', [decoded.id]);
      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'User account not found.' });
      }
      req.user = { ...rows[0], role: 'user', name: rows[0].full_name };
    } else {
      return res.status(401).json({ success: false, message: 'Invalid token role.' });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Authentication failed. Invalid token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Required role: ${roles.join(' or ')}.`
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};

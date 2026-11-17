const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Generate JWT token helper
const signToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'ecocycle_super_secure_jwt_secret_key_2026_sai_iii',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 1. User Registration
exports.register = async (req, res) => {
  try {
    const { full_name, email, mobile_number, password } = req.body;

    if (!full_name || !email || !mobile_number || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, mobile_number, password) VALUES (?, ?, ?, ?)`,
      [full_name.trim(), email.toLowerCase().trim(), mobile_number.trim(), hashedPassword]
    );

    const userId = result.insertId;
    const token = signToken({ id: userId, role: 'user', email: email.toLowerCase().trim() });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to EcoCycle.',
      token,
      user: {
        id: userId,
        role: 'user',
        name: full_name.trim(),
        email: email.toLowerCase().trim(),
        mobile_number: mobile_number.trim()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// 2. Universal Login (handles admin, employee, and user)
exports.login = async (req, res) => {
  try {
    const { role, identifier, email, password } = req.body;
    const loginRole = role ? role.toLowerCase() : 'user';
    const loginId = (identifier || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide credentials and password.' });
    }

    if (loginRole === 'admin') {
      // Admin can log in with username or email
      const [rows] = await pool.query(
        'SELECT id, admin_name, username, email, mobile_number, password FROM admins WHERE username = ? OR email = ?',
        [loginId, loginId]
      );
      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid administrator credentials.' });
      }

      const admin = rows[0];
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid administrator credentials.' });
      }

      const token = signToken({ id: admin.id, role: 'admin', username: admin.username });
      return res.json({
        success: true,
        message: 'Admin login successful.',
        token,
        user: {
          id: admin.id,
          role: 'admin',
          name: admin.admin_name,
          username: admin.username,
          email: admin.email,
          mobile_number: admin.mobile_number
        }
      });
    } else if (loginRole === 'employee') {
      // Employee can log in with employee_code or email
      const [rows] = await pool.query(
        'SELECT id, employee_code, name, email, contact_number, address, password, status, joining_date FROM employees WHERE employee_code = ? OR email = ?',
        [loginId, loginId]
      );
      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid employee credentials.' });
      }

      const emp = rows[0];
      if (emp.status !== 'Active') {
        return res.status(403).json({ success: false, message: 'Your employee account is inactive. Please contact the administrator.' });
      }

      const isMatch = await bcrypt.compare(password, emp.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid employee credentials.' });
      }

      const token = signToken({ id: emp.id, role: 'employee', code: emp.employee_code });
      return res.json({
        success: true,
        message: 'Employee login successful.',
        token,
        user: {
          id: emp.id,
          role: 'employee',
          employee_code: emp.employee_code,
          name: emp.name,
          email: emp.email,
          contact_number: emp.contact_number,
          address: emp.address,
          status: emp.status,
          joining_date: emp.joining_date
        }
      });
    } else {
      // User login with email
      const [rows] = await pool.query(
        'SELECT id, full_name, email, mobile_number, password FROM users WHERE email = ?',
        [loginId.toLowerCase()]
      );
      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid user email or password.' });
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid user email or password.' });
      }

      const token = signToken({ id: user.id, role: 'user', email: user.email });
      return res.json({
        success: true,
        message: 'Login successful! Welcome back.',
        token,
        user: {
          id: user.id,
          role: 'user',
          name: user.full_name,
          email: user.email,
          mobile_number: user.mobile_number
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// 3. Get Current User / Profile (me)
exports.getMe = async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

// 4. Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { role, id } = req.user;

    if (role === 'admin') {
      const { admin_name, email, mobile_number } = req.body;
      await pool.query(
        'UPDATE admins SET admin_name = ?, email = ?, mobile_number = ? WHERE id = ?',
        [admin_name, email, mobile_number, id]
      );
      return res.json({ success: true, message: 'Administrator profile updated successfully.' });
    } else if (role === 'employee') {
      const { name, contact_number, address } = req.body;
      await pool.query(
        'UPDATE employees SET name = ?, contact_number = ?, address = ? WHERE id = ?',
        [name, contact_number, address, id]
      );
      return res.json({ success: true, message: 'Employee profile updated successfully.' });
    } else {
      const { full_name, mobile_number } = req.body;
      await pool.query(
        'UPDATE users SET full_name = ?, mobile_number = ? WHERE id = ?',
        [full_name, mobile_number, id]
      );
      return res.json({ success: true, message: 'User profile updated successfully.' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// 5. Change Password
exports.changePassword = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    let tableName = 'users';
    if (role === 'admin') tableName = 'admins';
    if (role === 'employee') tableName = 'employees';

    const [rows] = await pool.query(`SELECT password FROM ${tableName} WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const isMatch = await bcrypt.compare(current_password, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const hashedNew = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE ${tableName} SET password = ? WHERE id = ?`, [hashedNew, id]);

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

// 6. Logout
exports.logout = async (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
};

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateEmployeeCode } = require('../utils/codeGenerator');

exports.getAllEmployees = async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;
    let query = `
      SELECT e.id, e.employee_code, e.name, e.email, e.contact_number, e.address, 
             e.status, e.joining_date, e.created_at,
             COUNT(p.id) as total_assigned,
             SUM(CASE WHEN p.status = 'Collected' THEN 1 ELSE 0 END) as total_collected,
             SUM(CASE WHEN p.status = 'Recycled' THEN 1 ELSE 0 END) as total_recycled,
             SUM(CASE WHEN p.status = 'Rejected' THEN 1 ELSE 0 END) as total_rejected
      FROM employees e
      LEFT JOIN products p ON e.id = p.assigned_employee_id
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (e.name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ? OR e.contact_number LIKE ?)`;
      params.push(term, term, term, term);
    }

    if (status.trim()) {
      query += ` AND e.status = ?`;
      params.push(status.trim());
    }

    query += ` GROUP BY e.id ORDER BY e.id DESC`;

    const [employees] = await pool.query(query, params);
    return res.json({ success: true, employees });
  } catch (error) {
    console.error('getAllEmployees error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch employees.' });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, employee_code, name, email, contact_number, address, status, joining_date, created_at FROM employees WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const [assignedProducts] = await pool.query(
      `SELECT p.id, p.product_code, p.product_name, c.category_name, p.status, p.pickup_date, p.pickup_address,
              u.full_name as user_name, u.mobile_number as user_phone
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.assigned_employee_id = ?
       ORDER BY p.id DESC`,
      [id]
    );

    return res.json({
      success: true,
      employee: {
        ...rows[0],
        assignedProducts
      }
    });
  } catch (error) {
    console.error('getEmployeeById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch employee.' });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, contact_number, address, password, joining_date, status = 'Active' } = req.body;

    if (!name || !email || !contact_number || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, contact number, and password are required.' });
    }

    // Check duplicate email
    const [existing] = await pool.query('SELECT id FROM employees WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An employee with this email already exists.' });
    }

    const employee_code = await generateEmployeeCode();
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO employees (employee_code, name, email, contact_number, address, password, status, joining_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_code,
        name.trim(),
        email.toLowerCase().trim(),
        contact_number.trim(),
        address || '',
        hashedPassword,
        status,
        joining_date || new Date().toISOString().split('T')[0]
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Employee ${name} added successfully with ID ${employee_code}.`,
      employeeId: result.insertId,
      employee_code
    });
  } catch (error) {
    console.error('createEmployee error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create employee.' });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, contact_number, address, status, joining_date, password } = req.body;

    // Check if employee exists
    const [existing] = await pool.query('SELECT id, password FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    let query = `
      UPDATE employees 
      SET name = ?, email = ?, contact_number = ?, address = ?, status = ?, joining_date = ?
    `;
    const params = [name, email, contact_number, address, status, joining_date];

    if (password && password.trim().length >= 6) {
      const hashed = await bcrypt.hash(password.trim(), 10);
      query += `, password = ?`;
      params.push(hashed);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await pool.query(query, params);

    return res.json({ success: true, message: 'Employee updated successfully.' });
  } catch (error) {
    console.error('updateEmployee error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update employee.' });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee has assigned active products
    const [activeProducts] = await pool.query(
      "SELECT id FROM products WHERE assigned_employee_id = ? AND status IN ('Assigned', 'Under Investigation')",
      [id]
    );

    if (activeProducts.length > 0) {
      // Rather than deleting, deactivate
      await pool.query("UPDATE employees SET status = 'Inactive' WHERE id = ?", [id]);
      return res.json({
        success: true,
        message: 'Employee has active assignments. Status has been set to Inactive instead of deletion.'
      });
    }

    await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Employee removed successfully.' });
  } catch (error) {
    console.error('deleteEmployee error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove employee.' });
  }
};

const { pool } = require('../config/db');

exports.getProductReports = async (req, res) => {
  try {
    const { from_date, to_date, status, category_id } = req.query;

    let query = `
      SELECT p.id, p.product_code, p.product_name, c.category_name, p.status,
             p.expected_price, p.pickup_date, p.pickup_address, p.created_at,
             u.full_name as user_name, u.email as user_email, u.mobile_number as user_phone,
             e.name as employee_name, e.employee_code
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN employees e ON p.assigned_employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (from_date) {
      query += ` AND DATE(p.created_at) >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND DATE(p.created_at) <= ?`;
      params.push(to_date);
    }
    if (status && status !== 'All') {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    if (category_id && category_id !== 'All') {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    query += ` ORDER BY p.id DESC`;

    const [products] = await pool.query(query, params);

    // Summary counts for this report filter
    const summary = {
      total: products.length,
      pending: products.filter(p => p.status === 'Pending').length,
      assigned: products.filter(p => p.status === 'Assigned' || p.status === 'Under Investigation').length,
      collected: products.filter(p => p.status === 'Collected').length,
      sent_for_recycling: products.filter(p => p.status === 'Sent for Recycling').length,
      recycled: products.filter(p => p.status === 'Recycled').length,
      rejected: products.filter(p => p.status === 'Rejected').length,
      total_estimated_value: products.reduce((sum, p) => sum + (parseFloat(p.expected_price) || 0), 0)
    };

    return res.json({ success: true, summary, products });
  } catch (error) {
    console.error('getProductReports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate product reports.' });
  }
};

exports.getUserReports = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let query = `
      SELECT u.id, u.full_name, u.email, u.mobile_number, u.created_at,
             COUNT(p.id) as total_products,
             SUM(CASE WHEN p.status = 'Recycled' THEN 1 ELSE 0 END) as recycled_count,
             SUM(CASE WHEN p.status = 'Collected' THEN 1 ELSE 0 END) as collected_count
      FROM users u
      LEFT JOIN products p ON u.id = p.user_id
      WHERE 1=1
    `;
    const params = [];

    if (from_date) {
      query += ` AND DATE(u.created_at) >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND DATE(u.created_at) <= ?`;
      params.push(to_date);
    }

    query += ` GROUP BY u.id ORDER BY u.id DESC`;

    const [users] = await pool.query(query, params);
    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('getUserReports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate user reports.' });
  }
};

exports.getEmployeeReports = async (req, res) => {
  try {
    const [employees] = await pool.query(`
      SELECT e.id, e.employee_code, e.name, e.email, e.contact_number, e.status, e.joining_date,
             COUNT(p.id) as total_assigned,
             SUM(CASE WHEN p.status = 'Collected' THEN 1 ELSE 0 END) as collected,
             SUM(CASE WHEN p.status = 'Recycled' THEN 1 ELSE 0 END) as recycled,
             SUM(CASE WHEN p.status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM employees e
      LEFT JOIN products p ON e.id = p.assigned_employee_id
      GROUP BY e.id
      ORDER BY total_assigned DESC
    `);
    return res.json({ success: true, count: employees.length, employees });
  } catch (error) {
    console.error('getEmployeeReports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate employee reports.' });
  }
};

exports.exportReportsCSV = async (req, res) => {
  try {
    const { from_date, to_date, status, category_id } = req.query;

    let query = `
      SELECT p.product_code, p.product_name, c.category_name, p.brand, p.model_type,
             p.status, p.expected_price, p.pickup_date, p.pickup_address,
             u.full_name as user_name, u.mobile_number as user_phone,
             e.name as employee_name, p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN employees e ON p.assigned_employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (from_date) {
      query += ` AND DATE(p.created_at) >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND DATE(p.created_at) <= ?`;
      params.push(to_date);
    }
    if (status && status !== 'All') {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    if (category_id && category_id !== 'All') {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    query += ` ORDER BY p.id DESC`;

    const [rows] = await pool.query(query, params);

    // Build CSV
    const headers = [
      'Product ID',
      'Product Name',
      'Category',
      'Brand',
      'Model',
      'Status',
      'Expected Price ($)',
      'Pickup Date',
      'Pickup Address',
      'User Name',
      'User Contact',
      'Assigned Employee',
      'Submission Date'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const csvLines = [
      headers.join(','),
      ...rows.map(r => [
        escapeCsv(r.product_code),
        escapeCsv(r.product_name),
        escapeCsv(r.category_name),
        escapeCsv(r.brand),
        escapeCsv(r.model_type),
        escapeCsv(r.status),
        escapeCsv(r.expected_price),
        escapeCsv(r.pickup_date),
        escapeCsv(r.pickup_address),
        escapeCsv(r.user_name),
        escapeCsv(r.user_phone),
        escapeCsv(r.employee_name || 'Unassigned'),
        escapeCsv(r.created_at)
      ].join(','))
    ];

    const csvContent = csvLines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ecocycle_report_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('exportReportsCSV error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export CSV.' });
  }
};

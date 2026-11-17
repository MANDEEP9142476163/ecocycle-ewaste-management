const { pool } = require('../config/db');

exports.getAllUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const searchTerm = `%${search.trim()}%`;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM users 
       WHERE full_name LIKE ? OR email LIKE ? OR mobile_number LIKE ?`,
      [searchTerm, searchTerm, searchTerm]
    );

    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.mobile_number, u.created_at,
              COUNT(p.id) as total_products,
              SUM(CASE WHEN p.status = 'Recycled' THEN 1 ELSE 0 END) as recycled_products
       FROM users u
       LEFT JOIN products p ON u.id = p.user_id
       WHERE u.full_name LIKE ? OR u.email LIKE ? OR u.mobile_number LIKE ?
       GROUP BY u.id
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return res.json({
      success: true,
      total: countRows[0].total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      users
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [userRows] = await pool.query(
      'SELECT id, full_name, email, mobile_number, created_at FROM users WHERE id = ?',
      [id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [products] = await pool.query(
      `SELECT p.id, p.product_code, p.product_name, c.category_name, p.status, p.created_at, p.expected_price
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.user_id = ?
       ORDER BY p.id DESC`,
      [id]
    );

    return res.json({
      success: true,
      user: {
        ...userRows[0],
        products
      }
    });
  } catch (error) {
    console.error('getUserById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user details.' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, mobile_number } = req.body;

    await pool.query(
      'UPDATE users SET full_name = ?, mobile_number = ? WHERE id = ?',
      [full_name, mobile_number, id]
    );

    return res.json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

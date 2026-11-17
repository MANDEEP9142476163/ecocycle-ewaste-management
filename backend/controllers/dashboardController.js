const { pool } = require('../config/db');

// Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    // 1. Overall counts
    const [userCount] = await pool.query('SELECT COUNT(*) as total FROM users');
    const [empCount] = await pool.query("SELECT COUNT(*) as total FROM employees WHERE status = 'Active'");
    const [prodCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total_listed,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as assigned_products,
        SUM(CASE WHEN status = 'Pending' AND assigned_employee_id IS NULL THEN 1 ELSE 0 END) as unassigned_products,
        SUM(CASE WHEN status = 'Under Investigation' THEN 1 ELSE 0 END) as under_investigation,
        SUM(CASE WHEN status = 'Collected' THEN 1 ELSE 0 END) as collected_products,
        SUM(CASE WHEN status = 'Sent for Recycling' THEN 1 ELSE 0 END) as sent_for_recycling,
        SUM(CASE WHEN status = 'Recycled' THEN 1 ELSE 0 END) as recycled_products,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_products
      FROM products
    `);

    // 2. Status Distribution
    const [statusDist] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM products 
      GROUP BY status
    `);

    // 3. Category Distribution
    const [catDist] = await pool.query(`
      SELECT c.category_name, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY count DESC
    `);

    // 4. Monthly Submissions & Collection Trends (Last 6 months)
    const [monthlyTrends] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%b %Y') as month,
        DATE_FORMAT(created_at, '%Y-%m') as sort_key,
        COUNT(*) as submissions,
        SUM(CASE WHEN status IN ('Collected', 'Sent for Recycling', 'Recycled') THEN 1 ELSE 0 END) as collected
      FROM products
      GROUP BY sort_key, month
      ORDER BY sort_key ASC
      LIMIT 6
    `);

    // 5. Recent Submissions
    const [recentSubmissions] = await pool.query(`
      SELECT p.id, p.product_code, p.product_name, c.category_name, p.status, p.created_at,
             u.full_name as user_name, e.name as employee_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN employees e ON p.assigned_employee_id = e.id
      ORDER BY p.id DESC
      LIMIT 6
    `);

    return res.json({
      success: true,
      stats: {
        total_users: userCount[0].total,
        total_employees: empCount[0].total,
        total_products: prodCounts[0].total_listed || 0,
        pending_requests: prodCounts[0].pending_requests || 0,
        assigned_products: prodCounts[0].assigned_products || 0,
        unassigned_products: prodCounts[0].unassigned_products || 0,
        under_investigation: prodCounts[0].under_investigation || 0,
        collected_products: prodCounts[0].collected_products || 0,
        sent_for_recycling: prodCounts[0].sent_for_recycling || 0,
        recycled_products: prodCounts[0].recycled_products || 0,
        rejected_products: prodCounts[0].rejected_products || 0
      },
      charts: {
        status_distribution: statusDist,
        category_distribution: catDist,
        monthly_trends: monthlyTrends
      },
      recent_submissions: recentSubmissions
    });
  } catch (error) {
    console.error('getAdminDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin dashboard data.' });
  }
};

// Employee Dashboard
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const [counts] = await pool.query(`
      SELECT 
        COUNT(*) as total_assigned,
        SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as pending_assignment,
        SUM(CASE WHEN status = 'Under Investigation' THEN 1 ELSE 0 END) as under_investigation,
        SUM(CASE WHEN status = 'Collected' THEN 1 ELSE 0 END) as collected,
        SUM(CASE WHEN status = 'Sent for Recycling' THEN 1 ELSE 0 END) as sent_for_recycling,
        SUM(CASE WHEN status = 'Recycled' THEN 1 ELSE 0 END) as recycled,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM products
      WHERE assigned_employee_id = ?
    `, [employeeId]);

    // Active requests for this employee
    const [assignedRequests] = await pool.query(`
      SELECT p.id, p.product_code, p.product_name, c.category_name, p.status, p.pickup_date,
             p.pickup_address, p.expected_price, p.contact_person, p.contact_number,
             p.image_1, p.created_at,
             u.full_name as user_name, u.mobile_number as user_phone
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.assigned_employee_id = ?
      ORDER BY 
        CASE 
          WHEN p.status = 'Assigned' THEN 1
          WHEN p.status = 'Under Investigation' THEN 2
          WHEN p.status = 'Collected' THEN 3
          WHEN p.status = 'Sent for Recycling' THEN 4
          ELSE 5
        END, p.id DESC
    `, [employeeId]);

    return res.json({
      success: true,
      stats: {
        total_assigned: counts[0].total_assigned || 0,
        pending_investigation: (counts[0].pending_assignment || 0) + (counts[0].under_investigation || 0),
        collected: counts[0].collected || 0,
        sent_for_recycling: counts[0].sent_for_recycling || 0,
        recycled: counts[0].recycled || 0,
        rejected: counts[0].rejected || 0
      },
      assigned_requests: assignedRequests
    });
  } catch (error) {
    console.error('getEmployeeDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch employee dashboard data.' });
  }
};

// User Dashboard
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [counts] = await pool.query(`
      SELECT 
        COUNT(*) as total_listed,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN status = 'Assigned' OR status = 'Under Investigation' THEN 1 ELSE 0 END) as assigned_requests,
        SUM(CASE WHEN status = 'Collected' THEN 1 ELSE 0 END) as collected,
        SUM(CASE WHEN status = 'Sent for Recycling' THEN 1 ELSE 0 END) as sent_for_recycling,
        SUM(CASE WHEN status = 'Recycled' THEN 1 ELSE 0 END) as recycled,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM products
      WHERE user_id = ?
    `, [userId]);

    const [recentProducts] = await pool.query(`
      SELECT p.id, p.product_code, p.product_name, c.category_name, p.status, p.created_at,
             p.expected_price, p.pickup_date, e.name as employee_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN employees e ON p.assigned_employee_id = e.id
      WHERE p.user_id = ?
      ORDER BY p.id DESC
      LIMIT 8
    `, [userId]);

    return res.json({
      success: true,
      stats: {
        total_listed: counts[0].total_listed || 0,
        pending_requests: counts[0].pending_requests || 0,
        assigned_requests: counts[0].assigned_requests || 0,
        collected: counts[0].collected || 0,
        sent_for_recycling: counts[0].sent_for_recycling || 0,
        recycled: counts[0].recycled || 0,
        rejected: counts[0].rejected || 0
      },
      recent_products: recentProducts
    });
  } catch (error) {
    console.error('getUserDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user dashboard data.' });
  }
};

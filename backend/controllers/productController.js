const { pool } = require('../config/db');
const { generateProductCode } = require('../utils/codeGenerator');
const { createNotification } = require('../utils/notificationHelper');
const notificationService = require('../services/notificationService');

// 1. Create Product (User listing e-waste)
exports.createProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const {
      product_name,
      category_id,
      brand,
      model_type,
      description,
      expected_price,
      pickup_date,
      pickup_address,
      state_id,
      city_id,
      contact_person,
      contact_number
    } = req.body;

    if (!product_name || !category_id || !pickup_address || !pickup_date || !contact_number) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Product name, category, pickup date, pickup address, and contact number are required.'
      });
    }

    // Handle uploaded images
    let image1 = null;
    let image2 = null;
    if (req.files) {
      if (req.files.image_1 && req.files.image_1[0]) {
        image1 = `/uploads/${req.files.image_1[0].filename}`;
      }
      if (req.files.image_2 && req.files.image_2[0]) {
        image2 = `/uploads/${req.files.image_2[0].filename}`;
      }
    }

    const productCode = await generateProductCode();

    const [insertResult] = await connection.query(
      `INSERT INTO products (
        product_code, user_id, category_id, product_name, brand, model_type,
        description, expected_price, pickup_date, pickup_address, state_id, city_id,
        contact_person, contact_number, image_1, image_2, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        productCode,
        userId,
        category_id,
        product_name.trim(),
        brand ? brand.trim() : null,
        model_type ? model_type.trim() : null,
        description ? description.trim() : null,
        expected_price ? parseFloat(expected_price) : 0.00,
        pickup_date,
        pickup_address.trim(),
        state_id ? parseInt(state_id, 10) : null,
        city_id ? parseInt(city_id, 10) : null,
        contact_person ? contact_person.trim() : req.user.name,
        contact_number.trim(),
        image1,
        image2
      ]
    );

    const productId = insertResult.insertId;

    // Record initial tracking entry
    await connection.query(
      `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
       VALUES (?, NULL, NULL, 'Pending', 'Initial product pickup request submitted.', ?)`,
      [productId, `${req.user.name} (User)`]
    );

    await connection.commit();

    // Trigger automated multichannel notifications (Citizen confirmation + Admin alert)
    await notificationService.notifyPickupSubmitted({
      product: {
        id: productId,
        product_code: productCode,
        product_name: product_name.trim(),
        pickup_date,
        pickup_address: pickup_address.trim(),
        contact_number: contact_number.trim(),
        contact_person: contact_person ? contact_person.trim() : req.user.name,
        user_id: userId
      },
      user: req.user
    }).catch(err => console.error('[Notification] Pickup submit notify error:', err.message));

    return res.status(201).json({
      success: true,
      message: 'E-waste product listed successfully! Our team will review and assign an inspector.',
      productId,
      productCode
    });
  } catch (error) {
    await connection.rollback();
    console.error('createProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit product request.' });
  } finally {
    connection.release();
  }
};

// 2. Get All Products (role-scoped + search & filters)
exports.getAllProducts = async (req, res) => {
  try {
    const { role, id: authUserId } = req.user;
    const {
      status,
      category_id,
      search = '',
      unassigned,
      page = 1,
      limit = 50
    } = req.query;

    let query = `
      SELECT p.id, p.product_code, p.product_name, p.brand, p.model_type, p.description,
             p.expected_price, p.pickup_date, p.pickup_address, p.contact_person, p.contact_number,
             p.image_1, p.image_2, p.status, p.created_at, p.updated_at,
             c.category_name,
             u.full_name as user_name, u.email as user_email, u.mobile_number as user_phone,
             s.state_name, ct.city_name,
             e.id as employee_id, e.name as employee_name, e.employee_code
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN states s ON p.state_id = s.id
      LEFT JOIN cities ct ON p.city_id = ct.id
      LEFT JOIN employees e ON p.assigned_employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    // Role scoping
    if (role === 'user') {
      query += ` AND p.user_id = ?`;
      params.push(authUserId);
    } else if (role === 'employee') {
      query += ` AND p.assigned_employee_id = ?`;
      params.push(authUserId);
    }

    // Status filter
    if (status && status.trim()) {
      query += ` AND p.status = ?`;
      params.push(status.trim());
    }

    // Category filter
    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    // Unassigned filter (for Admin dashboard)
    if (unassigned === 'true' || unassigned === true) {
      query += ` AND p.assigned_employee_id IS NULL AND p.status = 'Pending'`;
    }

    // Search filter (Product ID, product name, or mobile number)
    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (p.product_code LIKE ? OR p.product_name LIKE ? OR p.contact_number LIKE ? OR u.mobile_number LIKE ?)`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY p.id DESC`;

    const [products] = await pool.query(query, params);
    return res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('getAllProducts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

// 3. Get Single Product by ID (with tracking history)
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: authUserId } = req.user;

    const [rows] = await pool.query(
      `SELECT p.*,
              c.category_name,
              u.full_name as user_name, u.email as user_email, u.mobile_number as user_phone,
              s.state_name, ct.city_name,
              e.name as employee_name, e.employee_code, e.contact_number as employee_phone
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN states s ON p.state_id = s.id
       LEFT JOIN cities ct ON p.city_id = ct.id
       LEFT JOIN employees e ON p.assigned_employee_id = e.id
       WHERE p.id = ? OR p.product_code = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product request not found.' });
    }

    const product = rows[0];

    // Access control checks
    if (role === 'user' && product.user_id !== authUserId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own products.' });
    }
    if (role === 'employee' && product.assigned_employee_id !== authUserId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view assigned products.' });
    }

    // Fetch tracking history
    const [history] = await pool.query(
      `SELECT th.*, e.name as employee_name, e.employee_code
       FROM tracking_history th
       LEFT JOIN employees e ON th.employee_id = e.id
       WHERE th.product_id = ?
       ORDER BY th.id ASC`,
      [product.id]
    );

    return res.json({
      success: true,
      product,
      tracking_history: history
    });
  } catch (error) {
    console.error('getProductById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
  }
};

// 4. Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: authUserId } = req.user;
    const { product_name, category_id, brand, model_type, description, expected_price, pickup_date, pickup_address } = req.body;

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = rows[0];

    if (role === 'user') {
      if (product.user_id !== authUserId) {
        return res.status(403).json({ success: false, message: 'You can only edit your own submissions.' });
      }
      if (product.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Cannot edit product after it has been assigned or investigated.' });
      }
    }

    await pool.query(
      `UPDATE products 
       SET product_name = ?, category_id = ?, brand = ?, model_type = ?, description = ?, expected_price = ?, pickup_date = ?, pickup_address = ?
       WHERE id = ?`,
      [product_name, category_id, brand, model_type, description, expected_price, pickup_date, pickup_address, id]
    );

    // Notify citizen & employee if schedule/address changed
    notificationService.notifyPickupScheduledOrUpdated({
      product: {
        id: product.id,
        product_code: product.product_code,
        product_name: product_name || product.product_name,
        pickup_date: pickup_date || product.pickup_date,
        pickup_address: pickup_address || product.pickup_address,
        contact_number: product.contact_number,
        user_id: product.user_id
      },
      user: req.user
    }).catch(err => console.error('[Notification] Schedule update notify error:', err.message));

    return res.json({ success: true, message: 'Product updated successfully.' });
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

// 5. Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: authUserId } = req.user;

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = rows[0];

    if (role === 'user') {
      if (product.user_id !== authUserId) {
        return res.status(403).json({ success: false, message: 'Unauthorized.' });
      }
      if (product.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Cannot delete request that is already assigned or processed.' });
      }
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    // Notify Admin of cancelled request
    notificationService.dispatch({
      eventType: 'request_cancelled',
      recipientRole: 'admin',
      title: 'E-Waste Pickup Request Cancelled',
      message: `Request [${product.product_code}] (${product.product_name}) was cancelled/deleted by ${req.user.name}.`,
      entityId: product.id
    }).catch(err => console.error('[Notification] Cancel request notify error:', err.message));

    // If product had an assigned employee, notify employee that task is cancelled
    if (product.assigned_employee_id) {
      notificationService.dispatch({
        eventType: 'task_cancelled',
        recipientRole: 'employee',
        recipientId: product.assigned_employee_id,
        title: 'Task Assignment Cancelled',
        message: `Task Notice: The assignment for item [${product.product_code}] (${product.product_name}) has been cancelled.`,
        entityId: product.id
      }).catch(err => console.error('[Notification] Cancel task employee notify error:', err.message));
    }

    return res.json({ success: true, message: 'Product request deleted successfully.' });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};

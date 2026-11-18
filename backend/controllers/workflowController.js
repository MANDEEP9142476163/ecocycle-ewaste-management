const { pool } = require('../config/db');
const notificationService = require('../services/notificationService');

// 1. Admin assigns employee to product
exports.assignProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { employee_id, remarks } = req.body;

    if (!employee_id) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Please select an employee to assign.' });
    }

    // Verify product exists
    const [prods] = await connection.query(
      `SELECT id, product_code, product_name, status, user_id, contact_person, contact_number, pickup_address, pickup_date
       FROM products WHERE id = ?`,
      [id]
    );
    if (prods.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Product request not found.' });
    }

    const product = prods[0];

    // Verify employee exists and is active
    const [emps] = await connection.query(
      "SELECT id, name, employee_code, email, contact_number FROM employees WHERE id = ? AND status = 'Active'",
      [employee_id]
    );
    if (emps.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Selected employee is invalid or inactive.' });
    }
    const employee = emps[0];

    const prevStatus = product.status;
    const newStatus = 'Assigned';

    // Update product
    await connection.query(
      'UPDATE products SET assigned_employee_id = ?, status = ? WHERE id = ?',
      [employee.id, newStatus, product.id]
    );

    // Record tracking history
    const historyRemark = remarks && remarks.trim()
      ? `Assigned to ${employee.name} (${employee.employee_code}). Remarks: ${remarks.trim()}`
      : `Assigned to ${employee.name} (${employee.employee_code}) for field investigation.`;

    await connection.query(
      `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
       VALUES (?, ?, ?, ?, ?, 'Admin')`,
      [product.id, employee.id, prevStatus, newStatus, historyRemark]
    );

    await connection.commit();

    // Trigger automated multichannel notifications (Citizen & Employee)
    await notificationService.notifyEmployeeAssigned({
      product,
      employee,
      user: { id: product.user_id }
    }).catch(err => console.error('[Notification] Assign notify error:', err.message));

    return res.json({
      success: true,
      message: `Product ${product.product_code} successfully assigned to ${employee.name}.`
    });
  } catch (error) {
    await connection.rollback();
    console.error('assignProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign employee.' });
  } finally {
    connection.release();
  }
};

// 2. Employee: Start / Mark Under Investigation
exports.investigateProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { remarks } = req.body;
    const employeeId = req.user.id;

    const [prods] = await connection.query(
      `SELECT id, product_code, product_name, status, assigned_employee_id, user_id, contact_person, contact_number, pickup_address
       FROM products WHERE id = ?`,
      [id]
    );
    if (prods.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = prods[0];

    if (product.assigned_employee_id !== employeeId) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this product.' });
    }

    if (product.status !== 'Assigned') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Product cannot be marked Under Investigation from current status "${product.status}".`
      });
    }

    const prevStatus = product.status;
    const newStatus = 'Under Investigation';

    await connection.query('UPDATE products SET status = ? WHERE id = ?', [newStatus, product.id]);

    const remarkText = remarks && remarks.trim()
      ? `On-site or virtual investigation in progress. ${remarks.trim()}`
      : 'Device undergoing physical condition and electronic component inspection.';

    await connection.query(
      `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product.id, employeeId, prevStatus, newStatus, remarkText, `${req.user.name} (${req.user.employee_code})`]
    );

    await connection.commit();

    // Trigger automated multichannel notifications
    await notificationService.notifyUnderInvestigation({
      product,
      employee: req.user,
      user: { id: product.user_id },
      remarks: remarkText
    }).catch(err => console.error('[Notification] Investigation notify error:', err.message));

    return res.json({ success: true, message: 'Product is now under investigation.' });
  } catch (error) {
    await connection.rollback();
    console.error('investigateProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update investigation status.' });
  } finally {
    connection.release();
  }
};

// 3. Employee: Collect Product (Accept Collection)
exports.collectProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { remarks } = req.body;
    const employeeId = req.user.id;

    const [prods] = await connection.query(
      `SELECT id, product_code, product_name, status, assigned_employee_id, user_id, contact_person, contact_number, pickup_address
       FROM products WHERE id = ?`,
      [id]
    );
    if (prods.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = prods[0];

    if (product.assigned_employee_id !== employeeId) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this product.' });
    }

    if (!['Assigned', 'Under Investigation'].includes(product.status)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Product cannot be collected from status "${product.status}".`
      });
    }

    const prevStatus = product.status;
    const newStatus = 'Collected';

    await connection.query('UPDATE products SET status = ? WHERE id = ?', [newStatus, product.id]);

    const remarkText = remarks && remarks.trim()
      ? remarks.trim()
      : 'E-waste item verified, accepted, and successfully collected from user location.';

    await connection.query(
      `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product.id, employeeId, prevStatus, newStatus, remarkText, `${req.user.name} (${req.user.employee_code})`]
    );

    await connection.commit();

    // Trigger automated multichannel notifications (Citizen & Admin)
    await notificationService.notifyProductCollected({
      product,
      employee: req.user,
      user: { id: product.user_id },
      remarks: remarkText
    }).catch(err => console.error('[Notification] Collection notify error:', err.message));

    return res.json({ success: true, message: 'Product marked as Collected successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('collectProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record collection.' });
  } finally {
    connection.release();
  }
};

// 4. Employee: Send for Recycling
exports.sendForRecycling = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { remarks, facility_name } = req.body;
    const employeeId = req.user.id;

    const [prods] = await connection.query(
      `SELECT id, product_code, product_name, status, assigned_employee_id, user_id, contact_person, contact_number
       FROM products WHERE id = ?`,
      [id]
    );
    if (prods.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = prods[0];

    if (product.assigned_employee_id !== employeeId) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this product.' });
    }

    if (product.status !== 'Collected') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Only Collected products can be sent for recycling. Current status: "${product.status}".`
      });
    }

    const prevStatus = product.status;
    const newStatus = 'Sent for Recycling';

    await connection.query('UPDATE products SET status = ? WHERE id = ?', [newStatus, product.id]);

    const remarkText = remarks && remarks.trim()
      ? remarks.trim()
      : (facility_name ? `Dispatched to ${facility_name} recovery facility.` : 'Dispatched to specialized electronic recycling and recovery plant.');

    await connection.query(
      `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product.id, employeeId, prevStatus, newStatus, remarkText, `${req.user.name} (${req.user.employee_code})`]
    );

    await connection.commit();

    // Trigger automated multichannel notifications
    await notificationService.notifySentForRecycling({
      product,
      employee: req.user,
      user: { id: product.user_id },
      remarks: remarkText
    }).catch(err => console.error('[Notification] Send recycling notify error:', err.message));

    return res.json({ success: true, message: 'Product marked as Sent for Recycling.' });
  } catch (error) {
    await connection.rollback();
    console.error('sendForRecycling error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update recycling status.' });
  } finally {
    connection.release();
  }
};

// 5. Employee: Complete Recycling (Mark as Recycled)
exports.completeRecycling = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { remarks } = req.body;
    const employeeId = req.user.id;

    const [prods] = await connection.query(
      `SELECT id, product_code, product_name, status, assigned_employee_id, user_id, contact_person, contact_number
       FROM products WHERE id = ?`,
      [id]
    );
    if (prods.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = prods[0];

    if (product.assigned_employee_id !== employeeId) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this product.' });
    }

    if (product.status !== 'Sent for Recycling') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Product must be "Sent for Recycling" before completing recycling. Current status: "${product.status}".`
      });
    }

    const prevStatus = product.status;
    const newStatus = 'Recycled';

    await connection.query('UPDATE products SET status = ? WHERE id = ?', [newStatus, product.id]);

    const remarkText = remarks && remarks.trim()
      ? remarks.trim()
      : 'Recycling process completed. Raw metals, polymers, and silicon extracted responsibly with zero landfill output.';

    await connection.query(
      `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product.id, employeeId, prevStatus, newStatus, remarkText, `${req.user.name} (${req.user.employee_code})`]
    );

    await connection.commit();

    // Trigger automated multichannel notifications
    await notificationService.notifyRecyclingCompleted({
      product,
      employee: req.user,
      user: { id: product.user_id },
      remarks: remarkText
    }).catch(err => console.error('[Notification] Complete recycling notify error:', err.message));

    return res.json({ success: true, message: 'Product marked as Recycled successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('completeRecycling error:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete recycling.' });
  } finally {
    connection.release();
  }
};

// 6. Employee: Reject Product (Requires mandatory rejection reason)
exports.rejectProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { rejection_reason } = req.body;
    const employeeId = req.user.id;

    if (!rejection_reason || !rejection_reason.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting a product.'
      });
    }

    const [prods] = await connection.query(
      `SELECT id, product_code, product_name, status, assigned_employee_id, user_id, contact_person, contact_number
       FROM products WHERE id = ?`,
      [id]
    );
    if (prods.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = prods[0];

    if (product.assigned_employee_id !== employeeId) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this product.' });
    }

    if (!['Assigned', 'Under Investigation'].includes(product.status)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Product in status "${product.status}" cannot be rejected.`
      });
    }

    const prevStatus = product.status;
    const newStatus = 'Rejected';

    await connection.query('UPDATE products SET status = ? WHERE id = ?', [newStatus, product.id]);

    const remarkText = `Rejected: ${rejection_reason.trim()}`;

    await connection.query(
      `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product.id, employeeId, prevStatus, newStatus, remarkText, `${req.user.name} (${req.user.employee_code})`]
    );

    await connection.commit();

    // Trigger automated multichannel notifications
    await notificationService.notifyProductRejected({
      product,
      employee: req.user,
      user: { id: product.user_id },
      rejectionReason: rejection_reason.trim()
    }).catch(err => console.error('[Notification] Reject notify error:', err.message));

    return res.json({ success: true, message: 'Product has been marked as Rejected.' });
  } catch (error) {
    await connection.rollback();
    console.error('rejectProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject product.' });
  } finally {
    connection.release();
  }
};

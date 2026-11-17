const { pool } = require('../config/db');

async function createNotification({ recipientRole, recipientId = null, title, message }) {
  try {
    await pool.query(
      `INSERT INTO notifications (recipient_role, recipient_id, title, message, is_read)
       VALUES (?, ?, ?, ?, FALSE)`,
      [recipientRole, recipientId, title, message]
    );
  } catch (error) {
    console.error('[Notification] Error creating notification:', error.message);
  }
}

module.exports = {
  createNotification
};

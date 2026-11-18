const { pool } = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = `
      SELECT * FROM notifications 
      WHERE (recipient_role = ? AND (recipient_id = ? OR recipient_id IS NULL))
      ORDER BY id DESC
      LIMIT 50
    `;
    const [notifications] = await pool.query(query, [role, id]);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.json({ success: true, unreadCount, notifications });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Marked as read.' });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { role, id } = req.user;
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE recipient_role = ? AND (recipient_id = ? OR recipient_id IS NULL)',
      [role, id]
    );
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark all as read.' });
  }
};

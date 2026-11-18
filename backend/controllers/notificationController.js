const { pool } = require('../config/db');
const notificationService = require('../services/notificationService');

// 1. Get In-App Notifications for Current User
exports.getNotifications = async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = `
      SELECT * FROM notifications 
      WHERE (recipient_role = ? AND (recipient_id = ? OR recipient_id IS NULL))
      ORDER BY id DESC
      LIMIT 30
    `;
    const [notifications] = await pool.query(query, [role, id]);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.json({ success: true, unreadCount, notifications });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

// 2. Mark Single In-App Notification as Read
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

// 3. Mark All In-App Notifications as Read
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

// 4. Admin: Get Notification Settings & Channel Statuses
exports.getNotificationSettings = async (req, res) => {
  try {
    const settings = await notificationService.getSettings(true);
    const channelStatus = await notificationService.getChannelStatus();
    return res.json({
      success: true,
      settings,
      channelStatus
    });
  } catch (error) {
    console.error('getNotificationSettings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notification settings.' });
  }
};

// 5. Admin: Update Notification Settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Settings payload must be an object.' });
    }

    const updated = await notificationService.updateSettings(settings);
    const channelStatus = await notificationService.getChannelStatus();

    return res.json({
      success: true,
      message: 'Notification settings updated successfully.',
      settings: updated,
      channelStatus
    });
  } catch (error) {
    console.error('updateNotificationSettings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification settings.' });
  }
};

// 6. Admin: Get Notification Logs (Audit Trail)
exports.getNotificationLogs = async (req, res) => {
  try {
    const {
      channel,
      status,
      event_type,
      search = '',
      page = 1,
      limit = 50
    } = req.query;

    let query = `SELECT * FROM notification_logs WHERE 1=1`;
    const params = [];

    if (channel && channel.trim()) {
      query += ` AND channel = ?`;
      params.push(channel.trim());
    }

    if (status && status.trim()) {
      query += ` AND status = ?`;
      params.push(status.trim());
    }

    if (event_type && event_type.trim()) {
      query += ` AND event_type = ?`;
      params.push(event_type.trim());
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (recipient_destination LIKE ? OR title_or_template LIKE ? OR message_content LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    const numLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const numOffset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * numLimit;
    params.push(numLimit, numOffset);

    const [logs] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM notification_logs WHERE 1=1`;
    const countParams = params.slice(0, -2);
    const [countRows] = await pool.query(countQuery, countParams);

    return res.json({
      success: true,
      total: countRows[0].total,
      page: parseInt(page, 10) || 1,
      limit: numLimit,
      logs
    });
  } catch (error) {
    console.error('getNotificationLogs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notification logs.' });
  }
};

// 7. Admin: Send Test Notification
exports.sendTestNotification = async (req, res) => {
  try {
    const { channel, destination, message } = req.body;

    if (!channel || !message) {
      return res.status(400).json({
        success: false,
        message: 'Channel (whatsapp, sms, in_app, or all) and message content are required.'
      });
    }

    const testEvent = 'admin_test_notification';
    const settings = await notificationService.getSettings();
    const isDryRun = settings.dry_run_mode === 'true';

    let result = {};

    if (channel === 'in_app' || channel === 'all') {
      result.inApp = await notificationService.sendInApp({
        recipientRole: 'admin',
        recipientId: req.user.id,
        title: '🌱 EcoCycle Notification System Test',
        message: `[TEST] ${message}`,
        eventType: testEvent
      });
    }

    if (channel === 'whatsapp' || channel === 'all') {
      const targetPhone = destination || settings.admin_alert_whatsapp;
      const waService = require('../services/whatsappService');
      const waResult = await waService.sendMessage({
        to: targetPhone,
        message: `🌱 EcoCycle Notification Test:\n${message}\n(Sent via Meta WhatsApp Cloud API)`,
        dryRun: isDryRun
      });

      await notificationService.logAttempt({
        channel: 'whatsapp',
        eventType: testEvent,
        recipientRole: 'admin',
        recipientId: req.user.id,
        recipientDestination: waResult.destination || targetPhone,
        titleOrTemplate: 'Manual Admin Test',
        messageContent: message,
        status: waResult.status,
        providerResponseId: waResult.providerResponseId,
        errorMessage: waResult.error
      });

      result.whatsapp = waResult;
    }

    if (channel === 'sms' || channel === 'all') {
      const targetPhone = destination || settings.admin_alert_mobile;
      const smsService = require('../services/smsService');
      const smsResult = await smsService.sendSMS({
        to: targetPhone,
        message: `EcoCycle Test Alert: ${message.slice(0, 100)}`,
        dryRun: isDryRun
      });

      await notificationService.logAttempt({
        channel: 'sms',
        eventType: testEvent,
        recipientRole: 'admin',
        recipientId: req.user.id,
        recipientDestination: smsResult.destination || targetPhone,
        titleOrTemplate: 'Manual Admin Test',
        messageContent: message,
        status: smsResult.status,
        providerResponseId: smsResult.providerResponseId,
        errorMessage: smsResult.error
      });

      result.sms = smsResult;
    }

    return res.json({
      success: true,
      message: 'Test notification triggered successfully.',
      dryRun: isDryRun,
      result
    });
  } catch (error) {
    console.error('sendTestNotification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send test notification.' });
  }
};

// 8. Public: Submit Contact Inquiry
exports.submitContactInquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message, consent_sms_whatsapp } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO contact_inquiries (name, email, phone, subject, message, consent_sms_whatsapp, status)
       VALUES (?, ?, ?, ?, ?, ?, 'New')`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        phone ? phone.trim() : null,
        subject ? subject.trim() : null,
        message.trim(),
        Boolean(consent_sms_whatsapp)
      ]
    );

    const inquiryId = result.insertId;

    // Trigger notification asynchronously (non-blocking)
    notificationService.notifyContactInquiry({
      inquiry: {
        id: inquiryId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        subject: subject ? subject.trim() : null,
        message: message.trim(),
        consent_sms_whatsapp: Boolean(consent_sms_whatsapp)
      }
    }).catch(err => {
      console.error('[NotificationService] Inquiry dispatch error:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your inquiry has been safely recorded. Our green recovery team has been notified.',
      inquiryId
    });
  } catch (error) {
    console.error('submitContactInquiry error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit contact inquiry.' });
  }
};

// 9. Admin: Get Contact Inquiries
exports.getContactInquiries = async (req, res) => {
  try {
    const { status, search = '' } = req.query;
    let query = `SELECT * FROM contact_inquiries WHERE 1=1`;
    const params = [];

    if (status && status.trim()) {
      query += ` AND status = ?`;
      params.push(status.trim());
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY id DESC LIMIT 100`;
    const [inquiries] = await pool.query(query, params);

    return res.json({ success: true, count: inquiries.length, inquiries });
  } catch (error) {
    console.error('getContactInquiries error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch contact inquiries.' });
  }
};

// 10. Admin: Update Contact Inquiry Status / Notes
exports.updateContactInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    await pool.query(
      `UPDATE contact_inquiries 
       SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes)
       WHERE id = ?`,
      [status || null, admin_notes || null, id]
    );

    return res.json({ success: true, message: 'Inquiry updated successfully.' });
  } catch (error) {
    console.error('updateContactInquiry error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update contact inquiry.' });
  }
};

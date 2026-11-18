const notificationService = require('../services/notificationService');

async function createNotification({ recipientRole, recipientId = null, title, message, eventType = null, entityId = null }) {
  try {
    return await notificationService.sendInApp({
      recipientRole,
      recipientId,
      title,
      message,
      eventType,
      entityId
    });
  } catch (error) {
    console.error('[NotificationHelper] Error creating notification:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createNotification
};

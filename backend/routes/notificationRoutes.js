const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

// Public contact inquiry submission
router.post('/inquiries', notificationController.submitContactInquiry);

// In-app notifications for authenticated users
router.get('/', authenticate, notificationController.getNotifications);
router.put('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.put('/:id/read', authenticate, notificationController.markAsRead);

// Admin Notification Controls, Diagnostics & Audit Logs
router.get('/settings', authenticate, authorize('admin'), notificationController.getNotificationSettings);
router.put('/settings', authenticate, authorize('admin'), notificationController.updateNotificationSettings);
router.get('/logs', authenticate, authorize('admin'), notificationController.getNotificationLogs);
router.post('/test', authenticate, authorize('admin'), notificationController.sendTestNotification);

// Admin Contact Inquiries Management
router.get('/inquiries-list', authenticate, authorize('admin'), notificationController.getContactInquiries);
router.put('/inquiries/:id', authenticate, authorize('admin'), notificationController.updateContactInquiry);

module.exports = router;

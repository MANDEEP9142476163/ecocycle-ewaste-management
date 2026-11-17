const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/admin', authenticate, authorize('admin'), dashboardController.getAdminDashboard);
router.get('/employee', authenticate, authorize('employee'), dashboardController.getEmployeeDashboard);
router.get('/user', authenticate, authorize('user'), dashboardController.getUserDashboard);

module.exports = router;

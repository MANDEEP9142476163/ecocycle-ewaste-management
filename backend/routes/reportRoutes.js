const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/products', authenticate, authorize('admin'), reportController.getProductReports);
router.get('/users', authenticate, authorize('admin'), reportController.getUserReports);
router.get('/employees', authenticate, authorize('admin'), reportController.getEmployeeReports);
router.get('/export-csv', authenticate, authorize('admin'), reportController.exportReportsCSV);

module.exports = router;

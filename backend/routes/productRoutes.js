const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const workflowController = require('../controllers/workflowController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Product submission with two images
router.post(
  '/',
  authenticate,
  authorize('user'),
  upload.fields([
    { name: 'image_1', maxCount: 1 },
    { name: 'image_2', maxCount: 1 }
  ]),
  productController.createProduct
);

// Get list of products (role-scoped in controller)
router.get('/', authenticate, productController.getAllProducts);

// Get single product with tracking history
router.get('/:id', authenticate, productController.getProductById);

// Update product (user edit pending, or admin)
router.put('/:id', authenticate, productController.updateProduct);

// Delete product
router.delete('/:id', authenticate, productController.deleteProduct);

// WORKFLOW ROUTES:
// Admin assigns product
router.post('/:id/assign', authenticate, authorize('admin'), workflowController.assignProduct);

// Employee investigation and status updates
router.post('/:id/investigate', authenticate, authorize('employee'), workflowController.investigateProduct);
router.post('/:id/collect', authenticate, authorize('employee'), workflowController.collectProduct);
router.post('/:id/send-for-recycling', authenticate, authorize('employee'), workflowController.sendForRecycling);
router.post('/:id/complete-recycling', authenticate, authorize('employee'), workflowController.completeRecycling);
router.post('/:id/reject', authenticate, authorize('employee'), workflowController.rejectProduct);

module.exports = router;

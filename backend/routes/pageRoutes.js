const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/:page_type', pageController.getPage);
router.put('/:page_type', authenticate, authorize('admin'), pageController.updatePage);

module.exports = router;

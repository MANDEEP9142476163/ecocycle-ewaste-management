const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, authorize } = require('../middleware/auth');

// States
router.get('/states', locationController.getAllStates);
router.post('/states', authenticate, authorize('admin'), locationController.createState);
router.put('/states/:id', authenticate, authorize('admin'), locationController.updateState);
router.delete('/states/:id', authenticate, authorize('admin'), locationController.deleteState);

// Cities
router.get('/cities', locationController.getCities);
router.post('/cities', authenticate, authorize('admin'), locationController.createCity);
router.put('/cities/:id', authenticate, authorize('admin'), locationController.updateCity);
router.delete('/cities/:id', authenticate, authorize('admin'), locationController.deleteCity);

module.exports = router;

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { getMyVehicles, getVehicleDetail, getVehiclePassport } = require('../controllers/vehicle.controller');
const { generateShareCode, listShareCodes } = require('../controllers/sharing.controller');

// All vehicle owner routes require auth and user role
router.use(requireAuth, requireRole('user'));

// GET  /api/vehicles/my
router.get('/my', getMyVehicles);

// GET  /api/vehicles/:id
router.get('/:id', getVehicleDetail);

// GET  /api/vehicles/:id/passport
router.get('/:id/passport', getVehiclePassport);

// POST /api/vehicles/:id/share  — generate a share code
router.post('/:id/share', generateShareCode);

// GET  /api/vehicles/:id/shares — list active codes for this vehicle
router.get('/:id/shares', listShareCodes);

module.exports = router;

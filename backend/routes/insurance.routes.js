const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { getDashboard, lookupVehicle, getReports } = require('../controllers/insurance.controller');

// All insurance routes require a valid token and the insurance role
// Insurance is read-only — no POST/PUT/DELETE routes exist
router.use(requireAuth, requireRole('insurance', 'admin'));

// GET /api/insurance/dashboard
router.get('/dashboard', getDashboard);

// GET /api/insurance/lookup/:merakiId
router.get('/lookup/:merakiId', lookupVehicle);

// GET /api/insurance/reports
router.get('/reports', getReports);

module.exports = router;

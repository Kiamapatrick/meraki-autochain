const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  getDashboard,
  addVehicle,
  getInventory,
  getVehicleDetail,
  requestInspection,
  cancelRequest,
} = require('../controllers/dealer.controller');

// All dealer routes require a valid token and the dealer role
router.use(requireAuth, requireRole('dealer', 'admin'));

// GET  /api/dealer/dashboard
router.get('/dashboard', getDashboard);

// GET  /api/dealer/inventory
router.get('/inventory', getInventory);

// POST /api/dealer/vehicles
router.post('/vehicles', addVehicle);

// GET  /api/dealer/inventory/:merakiId
router.get('/inventory/:merakiId', getVehicleDetail);

// POST /api/dealer/requests  — request an inspection
router.post('/requests', requestInspection);

// DELETE /api/dealer/requests/:id  — cancel a pending request
router.delete('/requests/:id', cancelRequest);

module.exports = router;

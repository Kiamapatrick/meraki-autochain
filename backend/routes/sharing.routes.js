const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { revokeShareCode, listAllShareCodes } = require('../controllers/sharing.controller');

router.use(requireAuth, requireRole('user'));

// POST /api/sharing/revoke
router.post('/revoke', revokeShareCode);

// GET  /api/sharing/all  — all active codes across all owned vehicles
router.get('/all', listAllShareCodes);

module.exports = router;

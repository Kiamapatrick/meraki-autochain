const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  revokeShareCode,
  listAllShareCodes,
  getSharedPassport,
} = require('../controllers/sharing.controller');

// POST /api/sharing/revoke — owner only
router.post('/revoke', requireAuth, requireRole('user'), revokeShareCode);

// GET /api/sharing/all — owner only. Must be registered BEFORE /:code below,
// or a request to /all would incorrectly match /:code with code="ALL".
router.get('/all', requireAuth, requireRole('user'), listAllShareCodes);

// GET /api/sharing/:code — PUBLIC, no auth. Must be last.
router.get('/:code', getSharedPassport);

module.exports = router;
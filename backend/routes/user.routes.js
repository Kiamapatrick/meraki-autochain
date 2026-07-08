const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { getProfile, updateProfile } = require('../controllers/user.controller');

router.use(requireAuth, requireRole('user'));

// GET  /api/user/profile
router.get('/profile', getProfile);

// PUT  /api/user/profile
router.put('/profile', updateProfile);

module.exports = router;

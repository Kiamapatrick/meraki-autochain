const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { getProfile, updateProfile, changePassword, deleteAccount, revokeAllSessions } = require('../controllers/user.controller');

router.use(requireAuth, requireRole('user'));

// GET  /api/user/profile
router.get('/profile', getProfile);

// PUT  /api/user/profile
router.put('/profile', updateProfile);

// PUT  /api/user/password
router.put('/password', changePassword);

// DELETE /api/user/account
router.delete('/account', deleteAccount);

// POST /api/auth/revoke-all
router.post('/revoke-all', revokeAllSessions);

module.exports = router;

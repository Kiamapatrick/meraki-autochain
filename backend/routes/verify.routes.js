const express = require('express');
const router = express.Router();
const { getPublicVerification } = require('../controllers/verify.controller');

// No auth middleware — this route is intentionally public
router.get('/:merakiId', getPublicVerification);

module.exports = router;
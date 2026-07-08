const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  getDashboard,
  createInspection,
  getMyInspections,
  getInspectionById,
  getMyVehicles,
  createCorrectionRecord,
} = require('../controllers/inspector.controller');

// --- Multer config for inspection photos ---
const uploadDir = path.join(__dirname, '..', 'uploads', 'inspections');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `inspection-${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are accepted.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per photo
});

// All inspector routes require a valid token and the inspector role
router.use(requireAuth, requireRole('inspector', 'admin'));

// GET  /api/inspector/dashboard
router.get('/dashboard', getDashboard);

// GET  /api/inspector/inspections
router.get('/inspections', getMyInspections);

// POST /api/inspector/inspections  (up to 10 photos)
router.post('/inspections', upload.array('photos', 10), createInspection);

// GET  /api/inspector/inspections/:id
router.get('/inspections/:id', getInspectionById);

// POST /api/inspector/inspections/:id/correction
router.post('/inspections/:id/correction', createCorrectionRecord);

// GET  /api/inspector/vehicles
router.get('/vehicles', getMyVehicles);

module.exports = router;

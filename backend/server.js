require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { connectBlockchain } = require('./config/blockchain');

// --- Connect to MongoDB ---
connectDB();

// --- Connect to Polygon Amoy (operator wallet + contract instance) ---
connectBlockchain();

const app = express();

// --- CORS ---
// Allow the frontend dev server and production origin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://127.0.0.1:8080',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:56802'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin ${origin} is not allowed.`));
    },
    credentials: true,
  })
);

// --- Body parsers ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Static file serving for uploaded inspection photos ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/inspector', require('./routes/inspector.routes'));
app.use('/api/dealer', require('./routes/dealer.routes'));
app.use('/api/insurance', require('./routes/insurance.routes'));
app.use('/api/vehicles', require('./routes/vehicle.routes'));
app.use('/api/sharing', require('./routes/sharing.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/verify', require('./routes/verify.routes'));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    platform: 'Meraki AutoChain',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Multer file type error
  if (err.message && err.message.includes('Only JPEG')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Multer size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred.',
  });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\nMeraki AutoChain API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
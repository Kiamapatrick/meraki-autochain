const crypto = require('crypto');
const Share = require('../models/Share');
const Vehicle = require('../models/Vehicle');
const Inspection = require('../models/Inspection');
const Verification = require('../models/Verification');

// Helper: generate a unique share code
const generateCode = () => {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MC-SHARE-${suffix}`;
};

// POST /api/vehicles/:id/share
// Generates a new share code for a vehicle owned by the current user
const generateShareCode = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      merakiId: req.params.id.toUpperCase(),
      owner: req.user._id,
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // Generate a unique code
    let code;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({ success: false, message: 'Could not generate unique share code.' });
      }
    } while (await Share.exists({ code }));

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const share = await Share.create({
      code,
      vehicleId: vehicle._id,
      createdBy: req.user._id,
      expiresAt,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      share: {
        code: share.code,
        expiresAt: share.expiresAt,
        vehicleId: vehicle.merakiId,
        vehicleName: `${vehicle.make} ${vehicle.model}`,
      },
    });
  } catch (error) {
    console.error('Generate share code error:', error);
    res.status(500).json({ success: false, message: 'Could not generate share code.' });
  }
};

// GET /api/vehicles/:id/shares
// Returns active share codes for a vehicle
const listShareCodes = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      merakiId: req.params.id.toUpperCase(),
      owner: req.user._id,
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const shares = await Share.find({
      vehicleId: vehicle._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      shares: shares.map(s => ({
        code: s.code,
        vehicleId: vehicle.merakiId,
        vehicleName: `${vehicle.make} ${vehicle.model}`,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('List share codes error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve share codes.' });
  }
};

// POST /api/sharing/revoke
// Revokes a share code (only the owner who created it can revoke)
const revokeShareCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Share code is required.' });
    }

    const share = await Share.findOne({ code: code.toUpperCase(), createdBy: req.user._id });
    if (!share) {
      return res.status(404).json({ success: false, message: 'Share code not found.' });
    }

    share.status = 'revoked';
    await share.save();

    res.status(200).json({ success: true, message: 'Share code revoked successfully.' });
  } catch (error) {
    console.error('Revoke share code error:', error);
    res.status(500).json({ success: false, message: 'Could not revoke share code.' });
  }
};

// GET /api/sharing/all
// Returns all active share codes for all vehicles owned by the user
const listAllShareCodes = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id }).select('_id merakiId make model');
    const vehicleIds = vehicles.map(v => v._id);
    const vehicleMap = Object.fromEntries(vehicles.map(v => [String(v._id), v]));

    const shares = await Share.find({
      vehicleId: { $in: vehicleIds },
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      shares: shares.map(s => {
        const veh = vehicleMap[String(s.vehicleId)];
        return {
          code: s.code,
          vehicleId: veh ? veh.merakiId : null,
          vehicleName: veh ? `${veh.make} ${veh.model}` : '—',
          expiresAt: s.expiresAt,
          createdAt: s.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error('List all share codes error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve share codes.' });
  }
};

// GET /api/sharing/:code — PUBLIC, no auth. What a buyer sees when sent a share link.
const getSharedPassport = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    const share = await Share.findOne({ code, status: 'active', expiresAt: { $gt: new Date() } });
    if (!share) {
      return res.status(404).json({ success: false, message: 'This share link is invalid or has expired.' });
    }

    const vehicle = await Vehicle.findById(share.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const inspections = await Inspection.find({ vehicleId: vehicle._id })
      .select('mileage condition inspectionDate hash blockchainStatus status createdAt')
      .sort({ inspectionDate: -1 });

    const verifications = await Verification.find({ vehicleId: vehicle._id })
      .select('transactionHash status timestamp')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      passport: {
        merakiId: vehicle.merakiId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        status: vehicle.status,
        inspectionCount: inspections.length,
        lastInspectionDate: inspections[0] ? inspections[0].inspectionDate : null,
      },
      inspections,
      verifications,
    });
  } catch (error) {
    console.error('Get shared passport error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve shared passport.' });
  }
};

module.exports = { generateShareCode, listShareCodes, revokeShareCode, listAllShareCodes, getSharedPassport };

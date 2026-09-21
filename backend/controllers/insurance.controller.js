const Vehicle = require('../models/Vehicle');
const Inspection = require('../models/Inspection');
const Verification = require('../models/Verification');

// GET /api/insurance/dashboard
const getDashboard = async (req, res) => {
  try {
    // Insurance sees platform-wide verified stats only - no private data
    const [totalVerified, totalInspections, recentVerifications] = await Promise.all([
      Vehicle.countDocuments({ status: 'verified' }),
      Inspection.countDocuments({ status: 'verified' }),
      Verification.find({ status: { $in: ['pending', 'confirmed'] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('vehicleId', 'merakiId make model year registrationNumber'),
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        totalVerifiedVehicles: totalVerified,
        totalVerifiedInspections: totalInspections,
        recentVerifications,
      },
    });
  } catch (error) {
    console.error('Insurance dashboard error:', error);
    res.status(500).json({ success: false, message: 'Could not load dashboard.' });
  }
};

// GET /api/insurance/lookup/:merakiId
// Returns safe vehicle history for insurance assessment.
// Private owner details and inspector personal info are never exposed.
const lookupVehicle = async (req, res) => {
  try {
    const { merakiId } = req.params;

    const vehicle = await Vehicle.findOne({ merakiId: merakiId.toUpperCase() });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `No vehicle found with Meraki ID: ${merakiId.toUpperCase()}`,
      });
    }

    // Pull full inspection history - sorted oldest first to show timeline
    const inspections = await Inspection.find({ vehicleId: vehicle._id })
      .sort({ inspectionDate: 1 })
      .select(
        'mileage condition checklist notes inspectionDate hash blockchainStatus status correctsInspectionId createdAt'
      );

    // Pull verification proofs
    const verifications = await Verification.find({ vehicleId: vehicle._id })
      .select('hash network transactionHash status timestamp')
      .sort({ timestamp: 1 });

    // Build the public vehicle passport - only what insurance needs
    const passport = {
      merakiId: vehicle.merakiId,
      registrationNumber: vehicle.registrationNumber,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      engineCapacity: vehicle.engineCapacity,
      verificationStatus: vehicle.status,
      firstRegisteredAt: vehicle.createdAt,
    };

    // Summarise inspection history without exposing inspector identity
    const inspectionHistory = inspections.map((insp) => ({
      id: insp._id,
      inspectionDate: insp.inspectionDate,
      mileage: insp.mileage,
      condition: insp.condition,
      checklist: insp.checklist,
      notes: insp.notes,
      hash: insp.hash,
      blockchainStatus: insp.blockchainStatus,
      status: insp.status,
      isCorrectionRecord: !!insp.correctsInspectionId,
      correctsInspection: insp.correctsInspectionId || null,
    }));

    // Hash integrity summary
    const hashProofs = verifications.map((v) => ({
      hash: v.hash,
      network: v.network,
      transactionHash: v.transactionHash,
      status: v.status,
      timestamp: v.timestamp,
    }));

    res.status(200).json({
      success: true,
      vehicle: passport,
      inspectionCount: inspections.length,
      inspectionHistory,
      hashProofs,
      integrityNote:
        'Each inspection hash is a SHA256 fingerprint of the original record. Any tampering produces a different hash.',
    });
  } catch (error) {
    console.error('Insurance lookup error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve vehicle records.' });
  }
};

// GET /api/insurance/reports
// Returns a list of recently verified vehicles for batch review
const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const filter = { status: 'verified' };
    if (Object.keys(dateFilter).length > 0) filter.createdAt = dateFilter;

    const vehicles = await Vehicle.find(filter)
      .select('merakiId registrationNumber make model year status createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Vehicle.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      reports: vehicles,
    });
  } catch (error) {
    console.error('Insurance reports error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve reports.' });
  }
};

// GET /api/insurance/lookup?reg=KAA001A — lookup by registration number
const lookupVehicleByReg = async (req, res) => {
  try {
    const { reg } = req.query;
    if (!reg) {
      return res.status(400).json({ success: false, message: 'Registration number is required.' });
    }

    const vehicle = await Vehicle.findOne({ registrationNumber: reg.toUpperCase().trim() });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        found: false,
        message: `No vehicle found with registration number: ${reg.toUpperCase()}`,
      });
    }

    req.params.merakiId = vehicle.merakiId;
    return lookupVehicle(req, res);
  } catch (error) {
    console.error('Insurance lookup-by-reg error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve vehicle records.' });
  }
};

module.exports = { getDashboard, lookupVehicle, lookupVehicleByReg, getReports };

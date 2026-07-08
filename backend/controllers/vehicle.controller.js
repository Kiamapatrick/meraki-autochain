const Vehicle = require('../models/Vehicle');
const Inspection = require('../models/Inspection');
const Verification = require('../models/Verification');

// GET /api/vehicles/my
// Returns all vehicles where owner = req.user._id
const getMyVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id })
      .select('merakiId registrationNumber make model year color fuelType transmission bodyType engineCapacity status createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    console.error('Get my vehicles error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve vehicles.' });
  }
};

// GET /api/vehicles/:id
// Returns vehicle details by merakiId (owner must match)
const getVehicleDetail = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      merakiId: req.params.id.toUpperCase(),
      owner: req.user._id,
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    console.error('Get vehicle detail error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve vehicle.' });
  }
};

// GET /api/vehicles/:id/passport
// Returns a compiled vehicle passport (vehicle info + inspections + verifications)
const getVehiclePassport = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      merakiId: req.params.id.toUpperCase(),
      owner: req.user._id,
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const inspections = await Inspection.find({ vehicleId: vehicle._id })
      .select('mileage condition checklist notes inspectionDate hash blockchainStatus status createdAt')
      .sort({ inspectionDate: -1 });

    const verifications = await Verification.find({ vehicleId: vehicle._id })
      .select('hash network transactionHash status timestamp')
      .sort({ timestamp: -1 });

    const lastInspection = inspections[0] || null;
    const latestHash = verifications[0] || null;

    res.status(200).json({
      success: true,
      passport: {
        merakiId: vehicle.merakiId,
        registrationNumber: vehicle.registrationNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        bodyType: vehicle.bodyType,
        engineCapacity: vehicle.engineCapacity,
        vin: vehicle.vin,
        status: vehicle.status,
        mileage: lastInspection ? lastInspection.mileage : null,
        lastInspectionDate: lastInspection ? lastInspection.inspectionDate : null,
        inspectionCount: inspections.length,
        blockchainStatus: vehicle.status === 'verified' ? 'verified' : 'pending',
        latestHash: latestHash ? (latestHash.transactionHash || latestHash.hash) : null,
      },
      inspections,
      verifications,
    });
  } catch (error) {
    console.error('Get vehicle passport error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve vehicle passport.' });
  }
};

module.exports = { getMyVehicles, getVehicleDetail, getVehiclePassport };

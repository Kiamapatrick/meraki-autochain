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

// POST /api/vehicles
// Create a new vehicle for the current user
const createVehicle = async (req, res) => {
  try {
    const {
      registrationNumber,
      vin,
      make,
      model,
      year,
      color,
      engineCapacity,
      fuelType,
      transmission,
      bodyType,
    } = req.body;

    // Validate required fields
    if (!registrationNumber || !make || !model || !year) {
      return res.status(400).json({
        success: false,
        message: 'Registration number, make, model and year are required.',
      });
    }

    // Check for duplicate registration number (user can have multiple vehicles but not same plate)
    const existingReg = await Vehicle.findOne({
      registrationNumber: registrationNumber.toUpperCase(),
      owner: req.user._id,
    });
    if (existingReg) {
      return res.status(409).json({
        success: false,
        message: 'You already have a vehicle with this registration number.',
      });
    }

    // Check for duplicate VIN if provided
    if (vin) {
      const existingVin = await Vehicle.findOne({ vin: vin.toUpperCase() });
      if (existingVin) {
        return res.status(409).json({
          success: false,
          message: 'A vehicle with this VIN already exists.',
        });
      }
    }

    const vehicle = await Vehicle.create({
      registrationNumber: registrationNumber.toUpperCase(),
      vin: vin ? vin.toUpperCase() : undefined,
      make,
      model,
      year: Number(year),
      color,
      engineCapacity,
      fuelType,
      transmission,
      bodyType,
      owner: req.user._id,
      createdBy: req.user._id,
      createdByRole: req.user.role,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      vehicle,
    });
  } catch (error) {
    console.error('Create vehicle error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(' '),
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this identifier already exists.',
      });
    }

    res.status(500).json({ success: false, message: 'Could not register vehicle.' });
  }
};

module.exports = { getMyVehicles, getVehicleDetail, getVehiclePassport, createVehicle };

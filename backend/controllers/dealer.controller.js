const Vehicle = require('../models/Vehicle');
const Inspection = require('../models/Inspection');
const Verification = require('../models/Verification');

// GET /api/dealer/dashboard
const getDashboard = async (req, res) => {
  try {
    const dealerId = req.user._id;

    const [inventoryCount, pendingCount, verifiedCount] = await Promise.all([
      Vehicle.countDocuments({ createdBy: dealerId }),
      Vehicle.countDocuments({ createdBy: dealerId, status: 'pending' }),
      Vehicle.countDocuments({ createdBy: dealerId, status: 'verified' }),
    ]);

    const recentVehicles = await Vehicle.find({ createdBy: dealerId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      dashboard: {
        inventoryCount,
        pendingVerification: pendingCount,
        verifiedVehicles: verifiedCount,
        recentInventory: recentVehicles,
      },
    });
  } catch (error) {
    console.error('Dealer dashboard error:', error);
    res.status(500).json({ success: false, message: 'Could not load dashboard.' });
  }
};

// POST /api/dealer/vehicles
// Dealer adds a vehicle to their inventory. Status starts as 'pending'.
// A Meraki ID is auto-generated. The vehicle is not verified until an inspector submits an inspection.
const addVehicle = async (req, res) => {
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
    } = req.body;

    if (!registrationNumber || !make || !model || !year) {
      return res.status(400).json({
        success: false,
        message: 'Registration number, make, model and year are required.',
      });
    }

    // Prevent duplicate registrations
    const existing = await Vehicle.findOne({
      registrationNumber: registrationNumber.toUpperCase(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A vehicle with registration ${registrationNumber.toUpperCase()} already exists on the platform.`,
        merakiId: existing.merakiId,
      });
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      vin,
      make,
      model,
      year,
      color,
      engineCapacity,
      fuelType,
      transmission,
      createdBy: req.user._id,
      createdByRole: 'dealer',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added to inventory. Awaiting inspection.',
      vehicle: {
        id: vehicle._id,
        merakiId: vehicle.merakiId,
        registrationNumber: vehicle.registrationNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        status: vehicle.status,
      },
    });
  } catch (error) {
    console.error('Add vehicle error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(' ') });
    }

    res.status(500).json({ success: false, message: 'Could not add vehicle.' });
  }
};

// GET /api/dealer/inventory
const getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { createdBy: req.user._id };
    if (status) filter.status = status;

    const vehicles = await Vehicle.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Vehicle.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      vehicles,
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve inventory.' });
  }
};

// GET /api/dealer/inventory/:merakiId
const getVehicleDetail = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      merakiId: req.params.merakiId.toUpperCase(),
      createdBy: req.user._id,
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found in your inventory.' });
    }

    const inspections = await Inspection.find({ vehicleId: vehicle._id })
      .populate('inspectorId', 'name organization')
      .sort({ inspectionDate: -1 });

    res.status(200).json({
      success: true,
      vehicle,
      inspections,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not retrieve vehicle details.' });
  }
};

// POST /api/dealer/requests
// Dealer requests an inspection for one of their vehicles.
// This creates a pending inspection record (no inspectorId yet).
const requestInspection = async (req, res) => {
  try {
    const { merakiId, preferredDate, notes } = req.body;

    if (!merakiId) {
      return res.status(400).json({ success: false, message: 'Meraki ID is required.' });
    }

    const vehicle = await Vehicle.findOne({
      merakiId: merakiId.toUpperCase(),
      createdBy: req.user._id,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found in your inventory.',
      });
    }

    // Check if an active inspection request already exists for this vehicle
    // (no inspectorId = dealer-initiated pending request)
    const existingRequest = await Inspection.findOne({
      vehicleId: vehicle._id,
      inspectorId: null,
      status: 'submitted',
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'An inspection request for this vehicle is already pending.',
        requestId: existingRequest._id,
      });
    }

    // Create a placeholder inspection request
    // inspectorId is null until an inspector picks it up
    const request = await Inspection.create({
      vehicleId: vehicle._id,
      inspectorId: null,
      mileage: 0, // placeholder - inspector fills this in
      condition: 'fair', // placeholder - inspector fills this in
      notes: notes || '',
      inspectionDate: preferredDate ? new Date(preferredDate) : new Date(),
      status: 'submitted',
      hash: `PENDING-${vehicle.merakiId}-${Date.now()}`,
    });

    res.status(201).json({
      success: true,
      message: 'Inspection request submitted. An inspector will be assigned.',
      request: {
        id: request._id,
        vehicleId: vehicle._id,
        merakiId: vehicle.merakiId,
        status: request.status,
        preferredDate: request.inspectionDate,
      },
    });
  } catch (error) {
    console.error('Request inspection error:', error);
    res.status(500).json({ success: false, message: 'Could not submit inspection request.' });
  }
};

// DELETE /api/dealer/requests/:id
// Cancel a pending inspection request. Only if not yet picked up by an inspector.
const cancelRequest = async (req, res) => {
  try {
    const request = await Inspection.findOne({
      _id: req.params.id,
      inspectorId: null, // can only cancel if no inspector assigned yet
    }).populate('vehicleId', 'createdBy merakiId');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or already assigned to an inspector.',
      });
    }

    // Verify this dealer owns the vehicle
    if (request.vehicleId.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this request.',
      });
    }

    await Inspection.findByIdAndDelete(request._id);

    res.status(200).json({
      success: true,
      message: 'Inspection request cancelled.',
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ success: false, message: 'Could not cancel request.' });
  }
};

module.exports = {
  getDashboard,
  addVehicle,
  getInventory,
  getVehicleDetail,
  requestInspection,
  cancelRequest,
};

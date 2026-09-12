const Vehicle = require('../models/Vehicle');
const Inspection = require('../models/Inspection');
const Verification = require('../models/Verification');
const { generateHash } = require('../services/hash.service');
const { createProof, registerVehicleOnChain } = require('../services/blockchain.service');

// GET /api/inspector/dashboard
const getDashboard = async (req, res) => {
  try {
    const inspectorId = req.user._id;

    const [totalInspections, verifiedCount, pendingCount, recentInspections] = await Promise.all([
      Inspection.countDocuments({ inspectorId }),
      Inspection.countDocuments({ inspectorId, status: 'verified' }),
      Inspection.countDocuments({ inspectorId, status: 'submitted' }),
      Inspection.find({ inspectorId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('vehicleId', 'merakiId registrationNumber make model year'),
    ]);

    const vehicleCount = await Vehicle.countDocuments({ createdBy: inspectorId });

    res.status(200).json({
      success: true,
      dashboard: {
        totalInspections,
        verifiedInspections: verifiedCount,
        pendingInspections: pendingCount,
        vehiclesRegistered: vehicleCount,
        recentActivity: recentInspections,
      },
    });
  } catch (error) {
    console.error('Inspector dashboard error:', error);
    res.status(500).json({ success: false, message: 'Could not load dashboard.' });
  }
};

// POST /api/inspector/inspections
// Core flow: create or find vehicle -> create inspection -> hash -> verification proof
const createInspection = async (req, res) => {
  try {
    const {
      // Vehicle fields
      registrationNumber,
      vin,
      make,
      model,
      year,
      color,
      engineCapacity,
      fuelType,
      transmission,

      // Inspection fields
      mileage,
      condition,
      notes,
      inspectionDate,
      checklist,

      // If vehicle already has a Meraki ID, pass it to link to existing record
      merakiId,
    } = req.body;

    const inspectorId = req.user._id;

    // --- 1. Resolve vehicle ---
    let vehicle;

    if (merakiId) {
      // Inspector is adding a new inspection to an already-registered vehicle
      vehicle = await Vehicle.findOne({ merakiId: merakiId.toUpperCase() });
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: `No vehicle found with Meraki ID: ${merakiId}`,
        });
      }
    } else {
      // First inspection for this vehicle - create a new vehicle record
      if (!registrationNumber || !make || !model || !year) {
        return res.status(400).json({
          success: false,
          message: 'Registration number, make, model and year are required for a new vehicle.',
        });
      }

      // Check if a vehicle with this registration already exists
      const existing = await Vehicle.findOne({
        registrationNumber: registrationNumber.toUpperCase(),
      });

      if (existing) {
        // Use the existing vehicle record rather than creating a duplicate
        vehicle = existing;
      } else {
        vehicle = await Vehicle.create({
          registrationNumber,
          vin,
          make,
          model,
          year,
          color,
          engineCapacity,
          fuelType,
          transmission,
          createdBy: inspectorId,
          createdByRole: 'inspector',
        });

        // --- Register vehicle on-chain (Phase C) ---
        try {
          const chainResult = await registerVehicleOnChain(vehicle.merakiId, vehicle.vin);
          vehicle.blockchainTx = chainResult.transactionHash;
          await vehicle.save();
        } catch (chainError) {
          console.error('On-chain vehicle registration failed:', chainError.message);
          // Continue anyway — the vehicle still exists in Mongo; you can retry the chain call later.
        }
      }
    }

    if (!mileage || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Mileage and condition are required.',
      });
    }

    // --- 2. Handle uploaded photos ---
    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        photos.push({
          filename: file.filename,
          path: file.path,
        });
      });
    }

    const resolvedDate = inspectionDate ? new Date(inspectionDate) : new Date();

    // --- 3. Generate SHA256 hash from inspection data ---
    const hashInput = {
      vehicleId: vehicle._id.toString(),
      merakiId: vehicle.merakiId,
      registrationNumber: vehicle.registrationNumber,
      mileage: Number(mileage),
      inspectorId: inspectorId.toString(),
      inspectionDate: resolvedDate.toISOString(),
      condition,
    };

    const hash = generateHash(hashInput);

    // Guard against duplicate inspections (same data submitted twice)
    const duplicateCheck = await Inspection.findOne({ hash });
    if (duplicateCheck) {
      return res.status(409).json({
        success: false,
        message: 'An identical inspection record already exists.',
        existingInspectionId: duplicateCheck._id,
      });
    }

    // --- 4. Create inspection record ---
    const inspection = await Inspection.create({
      vehicleId: vehicle._id,
      inspectorId,
      mileage: Number(mileage),
      condition,
      notes,
      photos,
      checklist: checklist || {},
      inspectionDate: resolvedDate,
      hash,
      status: 'submitted',
      blockchainStatus: 'pending',
    });

    // --- 5. Create blockchain verification proof ---
    const proofResponse = await createProof(vehicle.merakiId, hash);

    const verification = await Verification.create({
      inspectionId: inspection._id,
      vehicleId: vehicle._id,
      hash,
      network: 'polygon',
      transactionHash: proofResponse.transactionHash,
      status: proofResponse.status,
      timestamp: new Date(),
      serviceResponse: proofResponse,
    });

    // Update inspection blockchain status to reflect on-chain confirmation
    inspection.blockchainStatus = proofResponse.status;
    await inspection.save();

    // --- 6. Mark vehicle as having at least one inspection ---
    if (vehicle.status === 'pending') {
      await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'verified' });
    }

    res.status(201).json({
      success: true,
      message: 'Inspection submitted and hash generated.',
      data: {
        inspection: {
          id: inspection._id,
          vehicleId: vehicle._id,
          merakiId: vehicle.merakiId,
          mileage: inspection.mileage,
          condition: inspection.condition,
          inspectionDate: inspection.inspectionDate,
          hash: inspection.hash,
          status: inspection.status,
        },
        vehicle: {
          merakiId: vehicle.merakiId,
          registrationNumber: vehicle.registrationNumber,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
        },
        verification: {
          id: verification._id,
          hash: verification.hash,
          status: verification.status,
          network: verification.network,
          transactionHash: proofResponse.transactionHash,
        },
      },
    });
  } catch (error) {
    console.error('Create inspection error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(' ') });
    }

    res.status(500).json({ success: false, message: 'Failed to create inspection.' });
  }
};

// GET /api/inspector/inspections
const getMyInspections = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { inspectorId: req.user._id };
    if (status) filter.status = status;

    const inspections = await Inspection.find(filter)
      .populate('vehicleId', 'merakiId registrationNumber make model year status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Inspection.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      inspections,
    });
  } catch (error) {
    console.error('Get inspections error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve inspections.' });
  }
};

// GET /api/inspector/inspections/:id
const getInspectionById = async (req, res) => {
  try {
    const inspection = await Inspection.findOne({
      _id: req.params.id,
      inspectorId: req.user._id,
    })
      .populate('vehicleId')
      .populate('inspectorId', 'name email organization');

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    const verification = await Verification.findOne({ inspectionId: inspection._id });

    res.status(200).json({
      success: true,
      inspection,
      verification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not retrieve inspection.' });
  }
};

// GET /api/inspector/vehicles
const getMyVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const inspectorId = req.user._id;

    // Vehicles this inspector created
    const created = await Vehicle.find({ createdBy: inspectorId });
    const createdIds = created.map((v) => v._id);

    // Vehicles this inspector has inspected (but may not have created)
    const inspectedVehicleIds = await Inspection.distinct('vehicleId', { inspectorId });

    // Union of both sets
    const allIds = [...new Set([...createdIds.map(String), ...inspectedVehicleIds.map(String)])];

    const vehicles = await Vehicle.find({ _id: { $in: allIds } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total: allIds.length,
      page: Number(page),
      vehicles,
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve vehicles.' });
  }
};

// POST /api/inspector/inspections/:id/correction
// Create a correction record. The original inspection is never modified.
const createCorrectionRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { correctionReason, ...correctionData } = req.body;

    if (!correctionReason) {
      return res.status(400).json({
        success: false,
        message: 'A correction reason is required.',
      });
    }

    const original = await Inspection.findOne({
      _id: id,
      inspectorId: req.user._id,
    }).populate('vehicleId');

    if (!original) {
      return res.status(404).json({ success: false, message: 'Original inspection not found.' });
    }

    const resolvedDate = new Date();

    const hashInput = {
      vehicleId: original.vehicleId._id.toString(),
      merakiId: original.vehicleId.merakiId,
      registrationNumber: original.vehicleId.registrationNumber,
      mileage: Number(correctionData.mileage || original.mileage),
      inspectorId: req.user._id.toString(),
      inspectionDate: resolvedDate.toISOString(),
      condition: correctionData.condition || original.condition,
    };

    const hash = generateHash(hashInput);

    const correction = await Inspection.create({
      vehicleId: original.vehicleId._id,
      inspectorId: req.user._id,
      mileage: correctionData.mileage || original.mileage,
      condition: correctionData.condition || original.condition,
      notes: correctionData.notes,
      inspectionDate: resolvedDate,
      hash,
      status: 'submitted',
      blockchainStatus: 'pending',
      correctsInspectionId: original._id,
      correctionReason,
    });

    const proofResponse = await createProof(original.vehicleId.merakiId, hash);

    await Verification.create({
      inspectionId: correction._id,
      vehicleId: original.vehicleId._id,
      hash,
      network: 'polygon',
      status: proofResponse.status,
      serviceResponse: proofResponse,
    });

    correction.blockchainStatus = proofResponse.status;
    await correction.save();

    res.status(201).json({
      success: true,
      message: 'Correction record created. Original inspection preserved.',
      correction: {
        id: correction._id,
        hash: correction.hash,
        correctsInspectionId: correction.correctsInspectionId,
        correctionReason: correction.correctionReason,
      },
    });
  } catch (error) {
    console.error('Correction record error:', error);
    res.status(500).json({ success: false, message: 'Could not create correction record.' });
  }
};

module.exports = {
  getDashboard,
  createInspection,
  getMyInspections,
  getInspectionById,
  getMyVehicles,
  createCorrectionRecord,
};

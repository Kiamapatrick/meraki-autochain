//models/Inspection.js
const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
    },

    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inspector ID is required'],
    },

    mileage: {
      type: Number,
      required: [true, 'Mileage is required'],
      min: [0, 'Mileage cannot be negative'],
    },

    // Overall condition rating
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: ['excellent', 'good', 'fair', 'poor'],
        message: 'Condition must be excellent, good, fair or poor',
      },
    },

    // Structured inspection checklist
    checklist: {
      engine: { type: String, enum: ['pass', 'fail', 'attention'], default: 'pass' },
      transmission: { type: String, enum: ['pass', 'fail', 'attention'], default: 'pass' },
      brakes: { type: String, enum: ['pass', 'fail', 'attention'], default: 'pass' },
      suspension: { type: String, enum: ['pass', 'fail', 'attention'], default: 'pass' },
      electricals: { type: String, enum: ['pass', 'fail', 'attention'], default: 'pass' },
      bodywork: { type: String, enum: ['pass', 'fail', 'attention'], default: 'pass' },
      interior: { type: String, enum: ['pass', 'fail', 'attention'], default: 'pass' },
      tyres: { type: String, enum: ['pass', 'fail', 'attention'], default: 'pass' },
    },

    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
      trim: true,
    },

    // File paths to uploaded inspection photos
    photos: [
      {
        filename: String,
        path: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    inspectionDate: {
      type: Date,
      required: [true, 'Inspection date is required'],
      default: Date.now,
    },

    // SHA256 hash of this inspection's core data.
    // This is what gets anchored to the blockchain.
    hash: {
      type: String,
      unique: true,
    },

    // Whether a blockchain proof has been created for this inspection
    blockchainStatus: {
      type: String,
      enum: ['pending', 'submitted', 'confirmed'],
      default: 'pending',
    },

    status: {
      type: String,
      enum: ['submitted', 'verified'],
      default: 'submitted',
    },

    // If this record corrects an earlier one, reference it here.
    // The original is NEVER modified. History is append-only.
    correctsInspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      default: null,
    },

    correctionReason: {
      type: String,
      maxlength: [500, 'Correction reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Block any updates to submitted inspections.
// The only allowed change is status going to 'verified'.
// Everything else is immutable.
inspectionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const allowedKeys = ['status', 'blockchainStatus', '$set'];

  const updateKeys = Object.keys(update);
  const forbidden = updateKeys.filter(
    (key) => !allowedKeys.includes(key) && key !== '__v'
  );

  if (forbidden.length > 0) {
    return next(
      new Error(
        `Inspection records are immutable. Attempted to modify: ${forbidden.join(', ')}. Create a correction record instead.`
      )
    );
  }

  next();
});

module.exports = mongoose.model('Inspection', inspectionSchema);

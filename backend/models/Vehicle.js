//models/vehicle.js
const mongoose = require('mongoose');
const { generateMerakiId } = require('../utils/generateId');

const vehicleSchema = new mongoose.Schema(
  {
    // The permanent Meraki identity. Never changes.
    // Registration plates, owners and status can all change.
    // This ID is the single source of truth for a vehicle's history.
    merakiId: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      uppercase: true,
      trim: true,
    },

    vin: {
      type: String,
      uppercase: true,
      trim: true,
    },

    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true,
    },

    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },

    year: {
      type: Number,
      required: [true, 'Vehicle year is required'],
      min: [1900, 'Year must be 1900 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },

    color: {
      type: String,
      trim: true,
    },

    engineCapacity: {
      type: String,
      trim: true,
    },

    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid', 'other'],
      default: 'petrol',
    },

    transmission: {
      type: String,
      enum: ['manual', 'automatic', 'other'],
    },

    // The owner of the vehicle (vehicle consumer/user)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // The user who first registered this vehicle on the platform
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Role of the creator (inspector / dealer)
    createdByRole: {
      type: String,
      enum: ['inspector', 'dealer', 'admin'],
    },

    status: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending',
    },

    // Track registration history without ever deleting old plates
    registrationHistory: [
      {
        registrationNumber: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate Meraki ID before first save
vehicleSchema.pre('save', async function (next) {
  if (this.isNew && !this.merakiId) {
    let id;
    let exists = true;

    // Regenerate if collision (astronomically unlikely but safe)
    while (exists) {
      id = generateMerakiId();
      exists = await mongoose.model('Vehicle').findOne({ merakiId: id });
    }

    this.merakiId = id;
  }
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);

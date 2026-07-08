//models/verification.js
const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    inspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
      unique: true, // one verification record per inspection
    },

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },

    // The SHA256 hash that was generated from the inspection data.
    // This is the value that will be stored on-chain.
    hash: {
      type: String,
      required: true,
    },

    // Target blockchain network
    network: {
      type: String,
      enum: ['polygon', 'ethereum', 'local'],
      default: 'polygon',
    },

    // The on-chain transaction hash returned after submission.
    // null until Polygon integration is active.
    transactionHash: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['pending', 'submitted', 'confirmed', 'failed'],
      default: 'pending',
    },

    // When this proof was anchored (or attempted)
    timestamp: {
      type: Date,
      default: Date.now,
    },

    // Raw response from the blockchain service (for debugging)
    serviceResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Verification', verificationSchema);

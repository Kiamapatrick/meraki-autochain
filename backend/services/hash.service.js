const crypto = require('crypto');

/**
 * Generates a SHA256 hash from inspection data.
 * This hash is the fingerprint of the inspection record.
 * Any change to the source data produces a completely different hash,
 * making tampering detectable.
 *
 * @param {Object} data - inspection data to hash
 * @returns {string} hex-encoded SHA256 hash
 */
const generateHash = (data) => {
  const payload = JSON.stringify({
    vehicleId: data.vehicleId,
    merakiId: data.merakiId,
    registrationNumber: data.registrationNumber,
    mileage: data.mileage,
    inspectorId: data.inspectorId,
    inspectionDate: data.inspectionDate,
    condition: data.condition,
  });

  return crypto.createHash('sha256').update(payload).digest('hex');
};

module.exports = { generateHash };

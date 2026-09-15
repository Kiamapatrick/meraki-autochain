const Vehicle = require('../models/Vehicle');
const { isVehicleVerifiedOnChain, getVehicleOnChain } = require('../services/blockchain.service');

// GET /api/verify/:merakiId — PUBLIC, no auth, no PII
const getPublicVerification = async (req, res) => {
  try {
    const merakiId = req.params.merakiId.toUpperCase();

    const vehicle = await Vehicle.findOne({ merakiId }).select('merakiId make model year status');
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const [verified, chainData] = await Promise.all([
      isVehicleVerifiedOnChain(merakiId),
      getVehicleOnChain(merakiId),
    ]);

    res.status(200).json({
      success: true,
      merakiId: vehicle.merakiId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      onChainVerified: verified,
      onChain: chainData,
    });
  } catch (error) {
    console.error('Public verification error:', error);
    res.status(500).json({ success: false, message: 'Could not verify vehicle.' });
  }
};

module.exports = { getPublicVerification };
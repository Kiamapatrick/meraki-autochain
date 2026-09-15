const { ethers } = require('ethers');
const { getContract } = require('../config/blockchain');

/**
 * Registers a vehicle on-chain. Call this once, the first time
 * a vehicle is assigned a Meraki ID.
 */
const registerVehicleOnChain = async (merakiId, vin) => {
  const contract = getContract();
  const vinHash = ethers.keccak256(ethers.toUtf8Bytes(vin));

  const tx = await contract.registerVehicle(merakiId, vinHash);
  const receipt = await tx.wait();

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
};

/**
 * Anchors an inspection hash on-chain.
 */
const createProof = async (merakiId, hash) => {
  const contract = getContract();
  const recordHash = '0x' + hash;

  const tx = await contract.recordInspection(merakiId, recordHash);
  const receipt = await tx.wait();

  return {
    status: 'confirmed',
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
};

/**
 * Reads back an inspection hash to confirm it's really on-chain.
 */
const verifyProof = async (hash) => {
  const contract = getContract();
  const recordHash = '0x' + hash;

  const [exists, timestamp, inspector, index] = await contract.verifyInspection(recordHash);

  return {
    exists,
    timestamp: exists ? new Date(Number(timestamp) * 1000).toISOString() : null,
    inspector: exists ? inspector : null,
    index: exists ? Number(index) : null,
  };
};

/**
 * Public, read-only check: is this vehicle registered, active, and inspected?
 */
const isVehicleVerifiedOnChain = async (merakiId) => {
  const contract = getContract();
  return await contract.isVehicleVerified(merakiId);
};

/**
 * Public, read-only: pull the on-chain registration record for a vehicle.
 */
const getVehicleOnChain = async (merakiId) => {
  const contract = getContract();
  const [registered, vinHash, registeredAt, registeredBy, totalInspections, active] =
    await contract.getVehicle(merakiId);

  return {
    registered,
    registeredAt: registered ? new Date(Number(registeredAt) * 1000).toISOString() : null,
    registeredBy: registered ? registeredBy : null,
    totalInspections: Number(totalInspections),
    active,
  };
};

module.exports = { registerVehicleOnChain, createProof, verifyProof, isVehicleVerifiedOnChain, getVehicleOnChain };
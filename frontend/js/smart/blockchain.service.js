/**
 * ================================================================
 *  MERAKI AUTOCHAIN — BLOCKCHAIN SERVICE
 *  services/blockchain.service.js
 * ================================================================
 *
 *  Connects the Express backend to the deployed MerakiAutoChain
 *  contract on Polygon. All on-chain writes go through this file.
 *
 *  Dependencies:
 *    npm install ethers crypto
 *
 *  Environment variables required (.env):
 *    POLYGON_RPC_URL      — e.g. https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
 *    OPERATOR_PRIVATE_KEY — private key of the wallet added as operator
 *    CONTRACT_ADDRESS     — deployed contract address from Remix
 * ================================================================
 */

const { ethers } = require('ethers');
const crypto     = require('crypto');

// ── ABI: only the functions this service calls ──────────────────
// Copy the full ABI from Remix after compiling, or use this minimal subset.

const CONTRACT_ABI = [
  // Write
  'function registerVehicle(string calldata merakiId, bytes32 vinHash) external',
  'function recordInspection(string calldata merakiId, bytes32 recordHash) external',
  'function deactivateVehicle(string calldata merakiId) external',

  // Read
  'function isVehicleVerified(string calldata merakiId) external view returns (bool)',
  'function verifyInspection(bytes32 recordHash) external view returns (bool exists, uint256 timestamp, address inspector, uint256 index)',
  'function getVehicle(string calldata merakiId) external view returns (bool registered, bytes32 vinHash, uint256 registeredAt, address registeredBy, uint256 inspectionCount, bool active)',
  'function getInspectionHashes(string calldata merakiId) external view returns (bytes32[] memory)',
  'function inspectionCount(string calldata merakiId) external view returns (uint256)',

  // Events
  'event VehicleRegistered(string indexed merakiId, bytes32 vinHash, address registeredBy, uint256 timestamp)',
  'event InspectionRecorded(string indexed merakiId, bytes32 recordHash, address inspector, uint256 timestamp, uint256 inspectionIndex)'
];

// ── Singleton setup ─────────────────────────────────────────────

let _provider = null;
let _signer   = null;
let _contract = null;

function getContract() {
  if (_contract) return _contract;

  const rpcUrl      = process.env.POLYGON_RPC_URL;
  const privateKey  = process.env.OPERATOR_PRIVATE_KEY;
  const address     = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !address) {
    throw new Error('Blockchain env vars not set: POLYGON_RPC_URL, OPERATOR_PRIVATE_KEY, CONTRACT_ADDRESS');
  }

  _provider = new ethers.JsonRpcProvider(rpcUrl);
  _signer   = new ethers.Wallet(privateKey, _provider);
  _contract = new ethers.Contract(address, CONTRACT_ABI, _signer);

  return _contract;
}

// ── Hashing helpers ─────────────────────────────────────────────

/**
 * Hash a VIN for on-chain registration.
 * Uses keccak256 to match what Solidity expects.
 *
 * @param {string} vin  — raw VIN string (e.g. "NZE164-0093742")
 * @returns {string}    — 0x-prefixed 32-byte hex string
 */
function hashVin(vin) {
  return ethers.keccak256(ethers.toUtf8Bytes(vin.trim().toUpperCase()));
}

/**
 * Hash a full inspection record for anchoring.
 * The input must be a canonical JSON string (sorted keys, no whitespace).
 * This is what gets stored on-chain and what verifyInspection() checks against.
 *
 * @param {object} inspectionRecord  — the full inspection document from MongoDB
 * @returns {string}                 — 0x-prefixed 32-byte hex string (SHA-256 as bytes32)
 */
function hashInspectionRecord(inspectionRecord) {
  // Fields included in the hash — must match exactly on every verification call.
  // Do NOT include fields that change after creation (_id is fine, updatedAt is not).
  const canonical = {
    merakiId:         inspectionRecord.merakiId,
    vehicleId:        inspectionRecord.vehicleId?.toString(),
    inspectorId:      inspectionRecord.inspectorId?.toString(),
    mileage:          inspectionRecord.mileage,
    condition:        inspectionRecord.condition,
    engineStatus:     inspectionRecord.engineStatus,
    bodyCondition:    inspectionRecord.bodyCondition,
    notes:            inspectionRecord.notes ?? '',
    inspectedAt:      inspectionRecord.inspectedAt instanceof Date
                        ? inspectionRecord.inspectedAt.toISOString()
                        : inspectionRecord.inspectedAt
  };

  // Sort keys alphabetically — ensures the same hash regardless of insertion order
  const json = JSON.stringify(canonical, Object.keys(canonical).sort());
  const sha256 = crypto.createHash('sha256').update(json, 'utf8').digest('hex');

  // Convert to bytes32 format (0x-prefixed 64 char hex)
  return '0x' + sha256;
}

// ── Write operations ────────────────────────────────────────────

/**
 * Register a vehicle on-chain when a Meraki ID is assigned.
 *
 * Call this from your vehicle creation route, after saving to MongoDB,
 * once the Meraki ID has been generated.
 *
 * @param {string} merakiId  — e.g. "MC-82HD92"
 * @param {string} vin       — raw VIN (hashed before sending)
 * @returns {{ txHash, blockNumber }}
 */
async function registerVehicle(merakiId, vin) {
  const contract = getContract();
  const vinHash  = hashVin(vin);

  const tx      = await contract.registerVehicle(merakiId, vinHash);
  const receipt = await tx.wait();

  return {
    txHash:      receipt.hash,
    blockNumber: receipt.blockNumber
  };
}

/**
 * Anchor a completed inspection on-chain.
 *
 * Call this after an inspector finalises a record and the backend
 * has marked it as complete in MongoDB. This is the critical step
 * that makes the record tamper-evident.
 *
 * @param {string} merakiId          — vehicle's Meraki ID
 * @param {object} inspectionRecord  — full MongoDB inspection document
 * @returns {{ txHash, blockNumber, recordHash }}
 */
async function recordInspection(merakiId, inspectionRecord) {
  const contract   = getContract();
  const recordHash = hashInspectionRecord(inspectionRecord);

  const tx      = await contract.recordInspection(merakiId, recordHash);
  const receipt = await tx.wait();

  return {
    txHash:      receipt.hash,
    blockNumber: receipt.blockNumber,
    recordHash              // store this back in MongoDB on the inspection document
  };
}

/**
 * Deactivate a vehicle (e.g. scrapped or fraud detected).
 */
async function deactivateVehicle(merakiId) {
  const contract = getContract();
  const tx       = await contract.deactivateVehicle(merakiId);
  const receipt  = await tx.wait();
  return { txHash: receipt.hash };
}

// ── Read / verification operations ─────────────────────────────

/**
 * Check whether a vehicle is registered and has at least one inspection.
 * Used to set the "Blockchain Verified" status on the passport page.
 *
 * @param {string} merakiId
 * @returns {boolean}
 */
async function isVehicleVerified(merakiId) {
  try {
    const contract = getContract();
    return await contract.isVehicleVerified(merakiId);
  } catch {
    return false;
  }
}

/**
 * Verify that a specific inspection record has not been tampered with.
 *
 * Fetch the inspection from MongoDB, pass it here, get back whether
 * the hash matches what is on-chain.
 *
 * @param {object} inspectionRecord  — MongoDB inspection document
 * @returns {{ verified, onChain: { timestamp, inspector, index } | null }}
 */
async function verifyInspectionRecord(inspectionRecord) {
  try {
    const contract   = getContract();
    const recordHash = hashInspectionRecord(inspectionRecord);

    const [ exists, timestamp, inspector, index ] =
      await contract.verifyInspection(recordHash);

    if (!exists) {
      return { verified: false, onChain: null };
    }

    return {
      verified: true,
      recordHash,
      onChain: {
        timestamp:   new Date(Number(timestamp) * 1000).toISOString(),
        inspector,
        index:       Number(index)
      }
    };
  } catch {
    return { verified: false, onChain: null };
  }
}

/**
 * Get full on-chain vehicle details.
 */
async function getVehicleOnChain(merakiId) {
  const contract = getContract();
  const [ registered, vinHash, registeredAt, registeredBy, count, active ] =
    await contract.getVehicle(merakiId);

  return {
    registered,
    vinHash,
    registeredAt: new Date(Number(registeredAt) * 1000).toISOString(),
    registeredBy,
    inspectionCount: Number(count),
    active
  };
}

/**
 * Get all inspection hashes for a vehicle.
 */
async function getInspectionHashes(merakiId) {
  const contract = getContract();
  return contract.getInspectionHashes(merakiId);
}

// ── Module exports ──────────────────────────────────────────────

module.exports = {
  // Hashing (for storing recordHash in MongoDB after anchoring)
  hashVin,
  hashInspectionRecord,

  // Write
  registerVehicle,
  recordInspection,
  deactivateVehicle,

  // Read
  isVehicleVerified,
  verifyInspectionRecord,
  getVehicleOnChain,
  getInspectionHashes
};

/**
 * Blockchain service - Polygon integration (future phase).
 *
 * Current behaviour:
 * Hashes are generated locally and stored in MongoDB.
 * The structure mirrors what the on-chain call will eventually send,
 * so the migration to Polygon requires no model changes.
 *
 * When Polygon integration is active:
 * - createProof() will submit the hash to a smart contract
 * - The contract returns a transactionHash
 * - That transactionHash becomes the immutable public proof
 */

const createProof = async (hash) => {
  // Placeholder - returns a pending proof with the local hash
  // Replace this body with the Polygon Web3/Ethers.js call
  return {
    status: 'pending',
    hash,
    network: 'polygon',
    transactionHash: null,
    timestamp: new Date().toISOString(),
    note: 'Blockchain integration pending. Hash is stored locally.',
  };
};

const verifyProof = async (hash, transactionHash) => {
  // Placeholder - will query the smart contract to confirm the hash on-chain
  return {
    verified: false,
    message: 'On-chain verification not yet active.',
    hash,
    transactionHash,
  };
};

module.exports = { createProof, verifyProof };

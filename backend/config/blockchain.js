const { ethers } = require('ethers');
const contractAbi = require('../abi/MerakiAutoChain.json');

let provider;
let wallet;
let contract;

/**
 * Sets up the ethers provider, operator wallet, and contract instance.
 * Called once at server startup, mirroring the connectDB() pattern.
 *
 * Required env vars:
 *   POLYGON_RPC_URL     - your Alchemy/Infura Amoy endpoint
 *   OPERATOR_PRIVATE_KEY - the private key of the wallet added via addOperator()
 *   CONTRACT_ADDRESS     - the deployed MerakiAutoChain address
 */
const connectBlockchain = () => {
    const { POLYGON_RPC_URL, OPERATOR_PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

    if (!POLYGON_RPC_URL || !OPERATOR_PRIVATE_KEY || !CONTRACT_ADDRESS) {
        console.warn(
            'Blockchain env vars missing (POLYGON_RPC_URL / OPERATOR_PRIVATE_KEY / CONTRACT_ADDRESS). ' +
            'Blockchain features will be unavailable until these are set.'
        );
        return;
    }

    try {
        provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
        wallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
        contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet);

        console.log(`Blockchain connected: operator ${wallet.address} -> contract ${CONTRACT_ADDRESS}`);
    } catch (error) {
        console.error(`Blockchain connection error: ${error.message}`);
    }
};

const getContract = () => {
    if (!contract) {
        throw new Error('Blockchain not connected. Check your .env configuration.');
    }
    return contract;
};

const getProvider = () => provider;

module.exports = { connectBlockchain, getContract, getProvider };
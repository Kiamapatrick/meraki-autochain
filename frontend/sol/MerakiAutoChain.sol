// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ================================================================
 *  MERAKI AUTOCHAIN
 *  Vehicle Inspection Registry — Polygon Mainnet / Amoy Testnet
 * ================================================================
 *
 *  Architecture:
 *  This contract is NOT the database. It is the trust anchor.
 *
 *  The backend (Node/MongoDB) holds all full records.
 *  This contract stores SHA-256 hashes of those records.
 *  Anyone can verify a record by hashing it and calling verify().
 *
 *  What lives here:
 *  - Vehicle registration (Meraki ID bound to a VIN hash)
 *  - Inspection record hashes (one per inspection)
 *  - Timestamp and inspector address for each inspection
 *  - Ownership transfer events
 *
 *  What does NOT live here:
 *  - Names, emails, phone numbers
 *  - Registration plate numbers
 *  - Inspector personal details
 *  - Raw mileage, images or documents
 *
 *  Roles:
 *  - Owner (deployer)     : can add/remove operators
 *  - Operators            : trusted backend wallets that write records
 *  - Anyone               : can read and verify
 *
 * ================================================================
 */

contract MerakiAutoChain {

    // ── State ──────────────────────────────────────────────────

    address public owner;

    // Wallets authorised to write records (backend service accounts)
    mapping(address => bool) public operators;

    // merakiId (e.g. "MC-82HD92") => Vehicle
    mapping(string => Vehicle) private vehicles;

    // merakiId => array of inspection record hashes in order
    mapping(string => bytes32[]) private inspectionHashes;

    // hash => InspectionEntry (for direct lookup by hash)
    mapping(bytes32 => InspectionEntry) private inspectionEntries;


    // ── Structs ────────────────────────────────────────────────

    struct Vehicle {
        bool      registered;
        bytes32   vinHash;       // keccak256 of the VIN — never store raw VIN
        uint256   registeredAt;
        address   registeredBy;
        uint256   inspectionCount;
        bool      active;
    }

    struct InspectionEntry {
        string    merakiId;
        bytes32   recordHash;    // SHA-256 of the full inspection JSON from backend
        uint256   timestamp;
        address   inspector;     // operator wallet that submitted this record
        uint256   index;         // position in the vehicle's inspection array
        bool      exists;
    }


    // ── Events ─────────────────────────────────────────────────

    event VehicleRegistered(
        string  indexed merakiId,
        bytes32         vinHash,
        address         registeredBy,
        uint256         timestamp
    );

    event InspectionRecorded(
        string  indexed merakiId,
        bytes32         recordHash,
        address         inspector,
        uint256         timestamp,
        uint256         inspectionIndex
    );

    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event VehicleDeactivated(string indexed merakiId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


    // ── Modifiers ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Meraki: caller is not the owner");
        _;
    }

    modifier onlyOperator() {
        require(
            operators[msg.sender] || msg.sender == owner,
            "Meraki: caller is not an authorised operator"
        );
        _;
    }

    modifier vehicleExists(string calldata merakiId) {
        require(vehicles[merakiId].registered, "Meraki: vehicle not registered");
        _;
    }

    modifier vehicleActive(string calldata merakiId) {
        require(vehicles[merakiId].active, "Meraki: vehicle record is inactive");
        _;
    }


    // ── Constructor ────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        operators[msg.sender] = true;
        emit OperatorAdded(msg.sender);
    }


    // ── Admin: operator management ─────────────────────────────

    /**
     * Add a backend wallet as an authorised operator.
     * Call this once with the wallet address your Node backend uses to sign transactions.
     */
    function addOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "Meraki: zero address");
        operators[_operator] = true;
        emit OperatorAdded(_operator);
    }

    function removeOperator(address _operator) external onlyOwner {
        operators[_operator] = false;
        emit OperatorRemoved(_operator);
    }

    /**
     * Transfer contract ownership to a new address.
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Meraki: zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }


    // ── Write: vehicles ────────────────────────────────────────

    /**
     * Register a vehicle on-chain.
     *
     * @param merakiId   The permanent Meraki ID (e.g. "MC-82HD92")
     * @param vinHash    keccak256(abi.encodePacked(vin)) — computed by the backend
     *
     * Called once per vehicle when the backend assigns a Meraki ID.
     * The VIN itself is never stored here.
     */
    function registerVehicle(
        string  calldata merakiId,
        bytes32          vinHash
    ) external onlyOperator {
        require(bytes(merakiId).length > 0,       "Meraki: empty merakiId");
        require(vinHash != bytes32(0),             "Meraki: empty vinHash");
        require(!vehicles[merakiId].registered,   "Meraki: vehicle already registered");

        vehicles[merakiId] = Vehicle({
            registered:       true,
            vinHash:          vinHash,
            registeredAt:     block.timestamp,
            registeredBy:     msg.sender,
            inspectionCount:  0,
            active:           true
        });

        emit VehicleRegistered(merakiId, vinHash, msg.sender, block.timestamp);
    }

    /**
     * Deactivate a vehicle record (does not delete history).
     * Used if a vehicle is scrapped or removed from the platform.
     */
    function deactivateVehicle(string calldata merakiId)
        external
        onlyOperator
        vehicleExists(merakiId)
    {
        vehicles[merakiId].active = false;
        emit VehicleDeactivated(merakiId);
    }


    // ── Write: inspections ─────────────────────────────────────

    /**
     * Anchor an inspection record on-chain.
     *
     * @param merakiId    The Meraki ID of the inspected vehicle
     * @param recordHash  SHA-256 hash of the full inspection JSON, as bytes32
     *
     * The backend:
     *   1. Completes the inspection record in MongoDB
     *   2. Serialises it to canonical JSON (sorted keys, no whitespace)
     *   3. Computes SHA-256 of that string
     *   4. Calls this function with the result
     *
     * Anyone can later verify by hashing the same JSON and calling verifyInspection().
     *
     * Inspections are immutable once recorded — this mirrors the backend model rule.
     */
    function recordInspection(
        string  calldata merakiId,
        bytes32          recordHash
    )
        external
        onlyOperator
        vehicleExists(merakiId)
        vehicleActive(merakiId)
    {
        require(recordHash != bytes32(0),              "Meraki: empty recordHash");
        require(!inspectionEntries[recordHash].exists, "Meraki: hash already recorded");

        uint256 index = vehicles[merakiId].inspectionCount;

        inspectionEntries[recordHash] = InspectionEntry({
            merakiId:   merakiId,
            recordHash: recordHash,
            timestamp:  block.timestamp,
            inspector:  msg.sender,
            index:      index,
            exists:     true
        });

        inspectionHashes[merakiId].push(recordHash);
        vehicles[merakiId].inspectionCount++;

        emit InspectionRecorded(
            merakiId,
            recordHash,
            msg.sender,
            block.timestamp,
            index
        );
    }


    // ── Read: verification ─────────────────────────────────────

    /**
     * Check whether a vehicle is registered and active.
     */
    function isVehicleVerified(string calldata merakiId) external view returns (bool) {
        Vehicle storage v = vehicles[merakiId];
        return v.registered && v.active && v.inspectionCount > 0;
    }

    /**
     * Check whether a specific inspection hash exists on-chain.
     *
     * This is the primary verification call.
     * The backend hashes a record and passes it here to confirm it was anchored.
     *
     * Returns: (exists, timestamp, inspectorAddress, inspectionIndex)
     */
    function verifyInspection(bytes32 recordHash)
        external
        view
        returns (
            bool    exists,
            uint256 timestamp,
            address inspector,
            uint256 index
        )
    {
        InspectionEntry storage entry = inspectionEntries[recordHash];
        return (
            entry.exists,
            entry.timestamp,
            entry.inspector,
            entry.index
        );
    }

    /**
     * Get full vehicle registration details.
     */
    function getVehicle(string calldata merakiId)
        external
        view
        returns (
            bool    registered,
            bytes32 vinHash,
            uint256 registeredAt,
            address registeredBy,
            uint256 inspectionCount,
            bool    active
        )
    {
        Vehicle storage v = vehicles[merakiId];
        return (
            v.registered,
            v.vinHash,
            v.registeredAt,
            v.registeredBy,
            v.inspectionCount,
            v.active
        );
    }

    /**
     * Get all inspection hashes for a vehicle, in chronological order.
     * The array index corresponds to the inspection sequence.
     */
    function getInspectionHashes(string calldata merakiId)
        external
        view
        vehicleExists(merakiId)
        returns (bytes32[] memory)
    {
        return inspectionHashes[merakiId];
    }

    /**
     * Get a specific inspection hash by vehicle and sequence index.
     */
    function getInspectionHashAt(string calldata merakiId, uint256 index)
        external
        view
        vehicleExists(merakiId)
        returns (bytes32)
    {
        require(index < inspectionHashes[merakiId].length, "Meraki: index out of range");
        return inspectionHashes[merakiId][index];
    }

    /**
     * Get full entry details for a specific hash.
     */
    function getInspectionEntry(bytes32 recordHash)
        external
        view
        returns (
            string  memory merakiId,
            uint256        timestamp,
            address        inspector,
            uint256        index,
            bool           exists
        )
    {
        InspectionEntry storage e = inspectionEntries[recordHash];
        return (e.merakiId, e.timestamp, e.inspector, e.index, e.exists);
    }

    /**
     * Total inspections recorded for a vehicle.
     */
    function inspectionCount(string calldata merakiId) external view returns (uint256) {
        return vehicles[merakiId].inspectionCount;
    }
}

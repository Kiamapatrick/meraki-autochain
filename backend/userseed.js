/**
 * seedPortalUsers.js — Meraki AutoChain Portal User Seeder
 * ----------------------------------------------------------
 * Adds vehicle owner accounts for the meraki-user-portal without
 * touching any existing collections. Safe to run repeatedly —
 * users that already exist (matched by email) are skipped.
 *
 * Usage:
 *   node seedPortalUsers.js
 *
 * Requires:
 *   MONGO_URI in your .env file
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const mongoose = require("mongoose");
const User = require("./models/User");

// ─── Seed Data — Portal Users ────────────────────────────────────────────────

const portalUserData = [
    {
        name: "Daniel Kariuki",
        email: "daniel.kariuki@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733100001",
        partnerStatus: "approved",
    },
    {
        name: "Faith Wanjiru",
        email: "faith.wanjiru@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733100002",
        partnerStatus: "approved",
    },
    {
        name: "Brian Otieno",
        email: "brian.otieno@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733100003",
        partnerStatus: "approved",
    },
    {
        name: "Esther Nyambura",
        email: "esther.nyambura@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733100004",
        partnerStatus: "approved",
    },
    {
        name: "Collins Mutiso",
        email: "collins.mutiso@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733100005",
        partnerStatus: "approved",
    },
    {
        name: "Naomi Chebet",
        email: "naomi.chebet@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733100006",
        partnerStatus: "approved",
    },
    {
        name: "Victor Mbugua",
        email: "victor.mbugua@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733100007",
        partnerStatus: "approved",
    },
    {
        name: "Grace Adhiambo",
        email: "grace.adhiambo@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733100008",
        partnerStatus: "approved",
    },
];

// ─── Seeder Function ─────────────────────────────────────────────────────────

async function seedPortalUsers() {
    console.log("\nMeraki AutoChain — Portal User Seeder");
    console.log("-".repeat(55));

    // 1. Connect
    console.log("\nConnecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 2. Iterate and add only missing users
    console.log("\nChecking portal users...");

    let addedCount = 0;
    let skippedCount = 0;
    const addedUsers = [];
    const skippedUsers = [];

    for (const data of portalUserData) {
        const existing = await User.findOne({ email: data.email });

        if (existing) {
            skippedCount++;
            skippedUsers.push(data.email);
            continue;
        }

        await new User(data).save();
        addedCount++;
        addedUsers.push(data.email);
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log("\n" + "-".repeat(55));
    console.log("Seeding complete. Summary:");
    console.log(`    Added   -> ${addedCount}`);
    if (addedUsers.length) {
        addedUsers.forEach((email) => console.log(`        + ${email}`));
    }
    console.log(`    Skipped -> ${skippedCount} (already existed)`);
    if (skippedUsers.length) {
        skippedUsers.forEach((email) => console.log(`        = ${email}`));
    }
    console.log("-".repeat(55));

    if (addedCount > 0) {
        console.log("\nAll new portal accounts use the password: password123");
    }
    console.log("");
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

seedPortalUsers()
    .then(() => {
        mongoose.connection.close();
        process.exit(0);
    })
    .catch((err) => {
        console.error("\nSeeding failed:", err.message);
        console.error(err);
        mongoose.connection.close();
        process.exit(1);
    });
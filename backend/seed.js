/**
 * seed.js — Meraki AutoChain Database Seeder
 * -------------------------------------------
 * Populates MongoDB with rich relational dummy data across
 * User, Vehicle, Inspection, and Verification collections.
 *
 * Usage:
 *   node seed.js
 *
 * Requires:
 *   MONGO_URI in your .env file
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const mongoose = require("mongoose");
const crypto = require("crypto");

// ─── Model Imports ───────────────────────────────────────────────────────────
const User = require("./models/User");
const Vehicle = require("./models/Vehicle");
const Inspection = require("./models/Inspection");
const Verification = require("./models/Verification");
const Share = require("./models/Share");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const randomHash = () =>
    crypto.createHash("sha256").update(crypto.randomBytes(32)).digest("hex");

const randomTxHash = () => "0x" + crypto.randomBytes(32).toString("hex");

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Produce a date between `daysAgo` days ago and today */
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const randDate = (maxDaysAgo, minDaysAgo = 0) =>
    daysAgo(randInt(minDaysAgo, maxDaysAgo));

// ─── Seed Data — Users ───────────────────────────────────────────────────────

const userData = [
    // ── Admins ──────────────────────────────────────────────────────────────
    {
        name: "Admin User",
        email: "admin@meraki.co.ke",
        password: "password123",
        role: "admin",
        phone: "+254700000001",
        partnerStatus: "approved",
    },
    {
        name: "Fatuma Ochieng",
        email: "fatuma.ochieng@meraki.co.ke",
        password: "password123",
        role: "admin",
        phone: "+254700000002",
        partnerStatus: "approved",
    },

    // ── Inspectors ───────────────────────────────────────────────────────────
    {
        name: "James Mwangi",
        email: "james.mwangi@meraki.co.ke",
        password: "password123",
        role: "inspector",
        phone: "+254711000001",
        partnerStatus: "approved",
    },
    {
        name: "Grace Achieng",
        email: "grace.achieng@meraki.co.ke",
        password: "password123",
        role: "inspector",
        phone: "+254711000002",
        partnerStatus: "approved",
    },
    {
        name: "Brian Kamau",
        email: "brian.kamau@meraki.co.ke",
        password: "password123",
        role: "inspector",
        phone: "+254711000003",
        partnerStatus: "approved",
    },
    {
        name: "Lucy Wanjiku",
        email: "lucy.wanjiku@meraki.co.ke",
        password: "password123",
        role: "inspector",
        phone: "+254711000004",
        partnerStatus: "approved",
    },
    {
        name: "Samuel Otieno",
        email: "samuel.otieno@meraki.co.ke",
        password: "password123",
        role: "inspector",
        phone: "+254711000005",
        partnerStatus: "approved",
    },
    {
        name: "Mercy Njeri",
        email: "mercy.njeri@meraki.co.ke",
        password: "password123",
        role: "inspector",
        phone: "+254711000006",
        partnerStatus: "approved",
    },
    {
        name: "David Kipchoge",
        email: "david.kipchoge@meraki.co.ke",
        password: "password123",
        role: "inspector",
        phone: "+254711000007",
        partnerStatus: "approved",
    },
    {
        name: "Amina Hassan",
        email: "amina.hassan@meraki.co.ke",
        password: "password123",
        role: "inspector",
        phone: "+254711000008",
        partnerStatus: "approved",
    },

    // ── Dealers ──────────────────────────────────────────────────────────────
    {
        name: "Nairobi Auto Dealers",
        email: "sales@nairobiauto.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000001",
        partnerStatus: "approved",
    },
    {
        name: "Eastlands Motors Ltd",
        email: "info@eastlandsmotors.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000002",
        partnerStatus: "approved",
    },
    {
        name: "Mombasa Road Autos",
        email: "sales@mombasaroadautos.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000003",
        partnerStatus: "approved",
    },
    {
        name: "Westlands Premier Cars",
        email: "info@westlandspremier.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000004",
        partnerStatus: "approved",
    },
    {
        name: "Thika Road Motors",
        email: "sales@thikaroad.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000005",
        partnerStatus: "approved",
    },
    {
        name: "Kisumu Lake Motors",
        email: "info@kisumulakemotors.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000006",
        partnerStatus: "approved",
    },
    {
        name: "Nakuru Valley Autos",
        email: "sales@nakuruvalley.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000007",
        partnerStatus: "approved",
    },
    {
        name: "Eldoret Speed Garage",
        email: "info@eldoretspeed.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000008",
        partnerStatus: "approved",
    },
    {
        name: "Karen Luxury Motors",
        email: "sales@karenluxury.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000009",
        partnerStatus: "approved",
    },
    {
        name: "Ngong Road Cars",
        email: "info@ngongroadcars.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000010",
        partnerStatus: "approved",
    },

    // ── Dealers — pending/rejected ────────────────────────────────────────────
    {
        name: "Gigiri Auto Hub",
        email: "sales@gigiriauto.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000011",
        partnerStatus: "pending",
    },
    {
        name: "South B Motors",
        email: "sales@southbmotors.co.ke",
        password: "password123",
        role: "dealer",
        phone: "+254722000012",
        partnerStatus: "rejected",
    },

    // ── Owner Portal Users (Consumer / Vehicle Owners) ─────────────────────────
    {
        name: "Peter Njoroge",
        email: "peter.njoroge@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733000001",
        partnerStatus: "approved",
    },
    {
        name: "Wanjiru Kariuki",
        email: "wanjiru.kariuki@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733000002",
        partnerStatus: "approved",
    },
    {
        name: "Ali Balogun",
        email: "ali.balogun@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733000003",
        partnerStatus: "approved",
    },
    {
        name: "Cynthia Mutua",
        email: "cynthia.mutua@gmail.com",
        password: "password123",
        role: "user",
        phone: "+254733000004",
        partnerStatus: "approved",
    },

    // ── Insurance / Partner Portal Users ───────────────────────────────────────
    {
        name: "Kevin Omondi",
        email: "kevin.omondi@gmail.com",
        password: "password123",
        role: "insurance",
        phone: "+254733000005",
        partnerStatus: "approved",
    },
    {
        name: "Aisha Wambua",
        email: "aisha.wambua@gmail.com",
        password: "password123",
        role: "insurance",
        phone: "+254733000006",
        partnerStatus: "approved",
    },
    {
        name: "Tom Githinji",
        email: "tom.githinji@gmail.com",
        password: "password123",
        role: "insurance",
        phone: "+254733000007",
        partnerStatus: "pending",
    },
    {
        name: "Sandra Moraa",
        email: "sandra.moraa@gmail.com",
        password: "password123",
        role: "insurance",
        phone: "+254733000008",
        partnerStatus: "pending",
    },
    // ── Special user ─────────────────────────────────────────────────────────
    {
        name: "Pato",
        email: "pato@gmail.com",
        password: "pato@2026!",
        role: "dealer",
        phone: "+254744000001",
        partnerStatus: "approved",
    },
];

// ─── Seed Data — Vehicles ────────────────────────────────────────────────────

const buildVehicleData = (dealers, inspectors, owners) => [
    // ── Toyota ───────────────────────────────────────────────────────────────
    {
        make: "Toyota", model: "Land Cruiser V8",
        year: 2020, vin: "JTMHX3BH502012345", registrationNumber: "KDG 001A",
        fuelType: "diesel", transmission: "automatic", mileage: 45000,
        color: "White", bodyType: "SUV", engineCapacity: "4500cc",
        createdBy: dealers[0]._id, createdByRole: "dealer",
        owner: owners[0]._id,
    },
    {
        make: "Toyota", model: "Hilux GR Sport",
        year: 2021, vin: "JTMHX3BH502067891", registrationNumber: "KDH 002B",
        fuelType: "diesel", transmission: "automatic", mileage: 32000,
        color: "Black", bodyType: "pickup", engineCapacity: "2800cc",
        createdBy: dealers[0]._id, createdByRole: "dealer",
        owner: owners[0]._id,
    },
    {
        make: "Toyota", model: "Prado TX",
        year: 2018, vin: "JTEBX3FH802034567", registrationNumber: "KDM 006F",
        fuelType: "diesel", transmission: "manual", mileage: 94000,
        color: "Grey", bodyType: "SUV", engineCapacity: "2700cc",
        createdBy: inspectors[1]._id, createdByRole: "inspector",
        owner: owners[1]._id,
    },
    {
        make: "Toyota", model: "Fortuner 2.8 GD-6",
        year: 2022, vin: "MHFYX59G502301234", registrationNumber: "KDN 007G",
        fuelType: "diesel", transmission: "automatic", mileage: 21000,
        color: "Pearl White", bodyType: "SUV", engineCapacity: "2800cc",
        createdBy: dealers[1]._id, createdByRole: "dealer",
        owner: owners[1]._id,
    },
    {
        make: "Toyota", model: "Camry XSE",
        year: 2021, vin: "4T1BZ1HK5MU123456", registrationNumber: "KDP 008H",
        fuelType: "petrol", transmission: "automatic", mileage: 38000,
        color: "Midnight Black", bodyType: "sedan", engineCapacity: "2500cc",
        createdBy: dealers[2]._id, createdByRole: "dealer",
        owner: owners[2]._id,
    },
    {
        make: "Toyota", model: "Corolla Cross Hybrid",
        year: 2023, vin: "NMTKS3EE50R023456", registrationNumber: "KDQ 009I",
        fuelType: "hybrid", transmission: "automatic", mileage: 9000,
        color: "Blue Metallic", bodyType: "crossover", engineCapacity: "1800cc",
        createdBy: dealers[3]._id, createdByRole: "dealer",
        owner: owners[2]._id,
    },
    {
        make: "Toyota", model: "Vitz RS",
        year: 2017, vin: "NCP131-1234567", registrationNumber: "KCV 212B",
        fuelType: "petrol", transmission: "automatic", mileage: 72000,
        color: "Silver", bodyType: "hatchback", engineCapacity: "1300cc",
        createdBy: dealers[4]._id, createdByRole: "dealer",
        owner: owners[3]._id,
    },
    {
        make: "Toyota", model: "Alphard Executive Lounge",
        year: 2020, vin: "JTMHX3BH502099999", registrationNumber: "KDT 012L",
        fuelType: "petrol", transmission: "automatic", mileage: 27000,
        color: "Pearl White", bodyType: "minivan", engineCapacity: "3500cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
        owner: owners[3]._id,
    },
    {
        make: "Toyota", model: "RAV4 Adventure",
        year: 2022, vin: "2T3RWRFV5NW012345", registrationNumber: "KDU 013M",
        fuelType: "petrol", transmission: "automatic", mileage: 19500,
        color: "Magnetic Gray", bodyType: "SUV", engineCapacity: "2500cc",
        createdBy: dealers[5]._id, createdByRole: "dealer",
    },
    {
        make: "Toyota", model: "Probox GL",
        year: 2016, vin: "NCP165-5678901", registrationNumber: "KBS 454C",
        fuelType: "petrol", transmission: "manual", mileage: 115000,
        color: "White", bodyType: "wagon", engineCapacity: "1500cc",
        createdBy: dealers[6]._id, createdByRole: "dealer",
    },

    // ── Ford ─────────────────────────────────────────────────────────────────
    {
        make: "Ford", model: "Ranger Wildtrak",
        year: 2022, vin: "1FTNX21L42EA12345", registrationNumber: "KDJ 003C",
        fuelType: "diesel", transmission: "automatic", mileage: 18000,
        color: "Silver", bodyType: "pickup", engineCapacity: "2000cc",
        createdBy: dealers[1]._id, createdByRole: "dealer",
    },
    {
        make: "Ford", model: "Everest Titanium",
        year: 2021, vin: "1FMHK8F87BGA12345", registrationNumber: "KDR 010J",
        fuelType: "diesel", transmission: "automatic", mileage: 41000,
        color: "Diffused Silver", bodyType: "SUV", engineCapacity: "2000cc",
        createdBy: dealers[2]._id, createdByRole: "dealer",
    },
    {
        make: "Ford", model: "Mustang GT500",
        year: 2020, vin: "1FA6P8CF5L5100000", registrationNumber: "KDS 011K",
        fuelType: "petrol", transmission: "automatic", mileage: 14000,
        color: "Race Red", bodyType: "coupe", engineCapacity: "5200cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },

    // ── Honda ────────────────────────────────────────────────────────────────
    {
        make: "Honda", model: "CR-V Sport",
        year: 2019, vin: "2HKRM4H79KH012345", registrationNumber: "KDK 004D",
        fuelType: "petrol", transmission: "automatic", mileage: 61000,
        color: "Blue", bodyType: "SUV", engineCapacity: "1500cc",
        createdBy: dealers[1]._id, createdByRole: "dealer",
    },
    {
        make: "Honda", model: "Accord Sport",
        year: 2020, vin: "1HGCV1F34LA012345", registrationNumber: "KDV 014N",
        fuelType: "petrol", transmission: "automatic", mileage: 47000,
        color: "Lunar Silver", bodyType: "sedan", engineCapacity: "1500cc",
        createdBy: dealers[3]._id, createdByRole: "dealer",
    },
    {
        make: "Honda", model: "Fit RS",
        year: 2018, vin: "JHMGK5H79JS012345", registrationNumber: "KCX 334F",
        fuelType: "petrol", transmission: "automatic", mileage: 83000,
        color: "White", bodyType: "hatchback", engineCapacity: "1300cc",
        createdBy: dealers[6]._id, createdByRole: "dealer",
    },
    {
        make: "Honda", model: "Pilot Touring",
        year: 2021, vin: "5FNYF6H09MB012345", registrationNumber: "KDW 015O",
        fuelType: "petrol", transmission: "automatic", mileage: 29000,
        color: "Sonic Gray Pearl", bodyType: "SUV", engineCapacity: "3500cc",
        createdBy: dealers[7]._id, createdByRole: "dealer",
    },

    // ── Tesla ────────────────────────────────────────────────────────────────
    {
        make: "Tesla", model: "Model 3 Long Range",
        year: 2023, vin: "5YJ3E1EA8NF012345", registrationNumber: "KDL 005E",
        fuelType: "electric", transmission: "automatic", mileage: 8000,
        color: "Red", bodyType: "sedan", engineCapacity: "electric",
        createdBy: inspectors[0]._id, createdByRole: "inspector",
    },
    {
        make: "Tesla", model: "Model Y Performance",
        year: 2023, vin: "5YJYGDEE9MF012345", registrationNumber: "KDX 016P",
        fuelType: "electric", transmission: "automatic", mileage: 5500,
        color: "Midnight Silver Metallic", bodyType: "SUV", engineCapacity: "electric",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "Tesla", model: "Model S Plaid",
        year: 2022, vin: "5YJSA1E46MF012345", registrationNumber: "KDY 017Q",
        fuelType: "electric", transmission: "automatic", mileage: 11000,
        color: "Deep Blue Metallic", bodyType: "sedan", engineCapacity: "electric",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },

    // ── Mercedes-Benz ────────────────────────────────────────────────────────
    {
        make: "Mercedes-Benz", model: "GLE 400d AMG Line",
        year: 2021, vin: "WDC1671081A012345", registrationNumber: "KDZ 018R",
        fuelType: "diesel", transmission: "automatic", mileage: 34000,
        color: "Obsidian Black", bodyType: "SUV", engineCapacity: "3000cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "Mercedes-Benz", model: "C-Class C200",
        year: 2020, vin: "WDD2050571R012345", registrationNumber: "KEA 019S",
        fuelType: "petrol", transmission: "automatic", mileage: 52000,
        color: "Iridium Silver", bodyType: "sedan", engineCapacity: "1500cc",
        createdBy: dealers[3]._id, createdByRole: "dealer",
    },
    {
        make: "Mercedes-Benz", model: "S-Class S500",
        year: 2022, vin: "WDDUG8FB0NA012345", registrationNumber: "KEB 020T",
        fuelType: "petrol", transmission: "automatic", mileage: 16000,
        color: "Manufaktur Diamond White", bodyType: "sedan", engineCapacity: "3000cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "Mercedes-Benz", model: "Sprinter 319 CDI",
        year: 2019, vin: "WDB9066332S012345", registrationNumber: "KEC 021U",
        fuelType: "diesel", transmission: "manual", mileage: 121000,
        color: "White", bodyType: "van", engineCapacity: "3000cc",
        createdBy: dealers[4]._id, createdByRole: "dealer",
    },

    // ── BMW ──────────────────────────────────────────────────────────────────
    {
        make: "BMW", model: "X5 xDrive40i",
        year: 2021, vin: "5UXCR6C05M9012345", registrationNumber: "KED 022V",
        fuelType: "petrol", transmission: "automatic", mileage: 31000,
        color: "Alpine White", bodyType: "SUV", engineCapacity: "3000cc",
        createdBy: dealers[3]._id, createdByRole: "dealer",
    },
    {
        make: "BMW", model: "3 Series 320i",
        year: 2020, vin: "WBA8E9G58LNU12345", registrationNumber: "KEE 023W",
        fuelType: "petrol", transmission: "automatic", mileage: 44000,
        color: "Portimao Blue", bodyType: "sedan", engineCapacity: "2000cc",
        createdBy: dealers[9]._id, createdByRole: "dealer",
    },
    {
        make: "BMW", model: "5 Series 530d M Sport",
        year: 2022, vin: "WBAJB9C52NCB12345", registrationNumber: "KEF 024X",
        fuelType: "diesel", transmission: "automatic", mileage: 22000,
        color: "Sophisto Grey", bodyType: "sedan", engineCapacity: "3000cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "BMW", model: "M4 Competition",
        year: 2022, vin: "WBS83CF07N3E12345", registrationNumber: "KEG 025Y",
        fuelType: "petrol", transmission: "automatic", mileage: 9500,
        color: "Sao Paulo Yellow", bodyType: "coupe", engineCapacity: "3000cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },

    // ── Volkswagen ───────────────────────────────────────────────────────────
    {
        make: "Volkswagen", model: "Tiguan 2.0 TDI",
        year: 2021, vin: "WVGZZZ5NZMW012345", registrationNumber: "KEH 026Z",
        fuelType: "diesel", transmission: "automatic", mileage: 37000,
        color: "Deep Black Pearl", bodyType: "SUV", engineCapacity: "2000cc",
        createdBy: dealers[5]._id, createdByRole: "dealer",
    },
    {
        make: "Volkswagen", model: "Golf GTI Mk8",
        year: 2022, vin: "WVWZZZ1KZ3W012345", registrationNumber: "KEI 027A",
        fuelType: "petrol", transmission: "automatic", mileage: 13000,
        color: "Kings Red", bodyType: "hatchback", engineCapacity: "2000cc",
        createdBy: dealers[9]._id, createdByRole: "dealer",
    },
    {
        make: "Volkswagen", model: "Passat Highline",
        year: 2019, vin: "WVWZZZ3CZ3E012345", registrationNumber: "KEJ 028B",
        fuelType: "petrol", transmission: "automatic", mileage: 68000,
        color: "Reflex Silver", bodyType: "sedan", engineCapacity: "1400cc",
        createdBy: dealers[6]._id, createdByRole: "dealer",
    },

    // ── Subaru ───────────────────────────────────────────────────────────────
    {
        make: "Subaru", model: "Outback 3.6R",
        year: 2020, vin: "4S4BSENC9L3012345", registrationNumber: "KEK 029C",
        fuelType: "petrol", transmission: "automatic", mileage: 55000,
        color: "Cascade Green Silica", bodyType: "wagon", engineCapacity: "3600cc",
        createdBy: dealers[5]._id, createdByRole: "dealer",
    },
    {
        make: "Subaru", model: "Forester XT Turbo",
        year: 2021, vin: "JF2SKAJC5MH012345", registrationNumber: "KEL 030D",
        fuelType: "petrol", transmission: "automatic", mileage: 28000,
        color: "Crystal White Pearl", bodyType: "SUV", engineCapacity: "2500cc",
        createdBy: dealers[4]._id, createdByRole: "dealer",
    },
    {
        make: "Subaru", model: "WRX STI",
        year: 2019, vin: "JF1VA2W63K9012345", registrationNumber: "KEM 031E",
        fuelType: "petrol", transmission: "manual", mileage: 49000,
        color: "WR Blue Pearl", bodyType: "sedan", engineCapacity: "2500cc",
        createdBy: dealers[9]._id, createdByRole: "dealer",
    },

    // ── Nissan ───────────────────────────────────────────────────────────────
    {
        make: "Nissan", model: "Navara NP300 Pro-4X",
        year: 2021, vin: "MNTBBD5X50A012345", registrationNumber: "KEN 032F",
        fuelType: "diesel", transmission: "automatic", mileage: 36000,
        color: "Storm White", bodyType: "pickup", engineCapacity: "2300cc",
        createdBy: dealers[6]._id, createdByRole: "dealer",
    },
    {
        make: "Nissan", model: "X-Trail 2.5 4WD",
        year: 2020, vin: "JN1TBNT32U0012345", registrationNumber: "KEO 033G",
        fuelType: "petrol", transmission: "automatic", mileage: 42000,
        color: "Pearl White", bodyType: "SUV", engineCapacity: "2500cc",
        createdBy: dealers[7]._id, createdByRole: "dealer",
    },
    {
        make: "Nissan", model: "Patrol Y62 Platinum",
        year: 2022, vin: "JN8AY2ND3N9012345", registrationNumber: "KEP 034H",
        fuelType: "petrol", transmission: "automatic", mileage: 17000,
        color: "Obsidian Black", bodyType: "SUV", engineCapacity: "5600cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "Nissan", model: "Leaf e+",
        year: 2022, vin: "1N4BZ1CP9NC012345", registrationNumber: "KEQ 035I",
        fuelType: "electric", transmission: "automatic", mileage: 12000,
        color: "Gun Metallic", bodyType: "hatchback", engineCapacity: "electric",
        createdBy: dealers[3]._id, createdByRole: "dealer",
    },

    // ── Mitsubishi ───────────────────────────────────────────────────────────
    {
        make: "Mitsubishi", model: "Outlander PHEV",
        year: 2022, vin: "JA4J4VA93NZ012345", registrationNumber: "KER 036J",
        fuelType: "hybrid", transmission: "automatic", mileage: 15000,
        color: "Ironbark Brown", bodyType: "SUV", engineCapacity: "2400cc",
        createdBy: dealers[2]._id, createdByRole: "dealer",
    },
    {
        make: "Mitsubishi", model: "Pajero Sport GT",
        year: 2020, vin: "MMBGCNS30JH012345", registrationNumber: "KES 037K",
        fuelType: "diesel", transmission: "automatic", mileage: 57000,
        color: "Sterling Silver", bodyType: "SUV", engineCapacity: "2400cc",
        createdBy: dealers[7]._id, createdByRole: "dealer",
    },
    {
        make: "Mitsubishi", model: "L200 Triton",
        year: 2021, vin: "MMBJNKB40LH012345", registrationNumber: "KET 038L",
        fuelType: "diesel", transmission: "manual", mileage: 63000,
        color: "White", bodyType: "pickup", engineCapacity: "2400cc",
        createdBy: dealers[6]._id, createdByRole: "dealer",
    },

    // ── Land Rover ───────────────────────────────────────────────────────────
    {
        make: "Land Rover", model: "Defender 110 X",
        year: 2022, vin: "SALGA2EX3N2012345", registrationNumber: "KEU 039M",
        fuelType: "diesel", transmission: "automatic", mileage: 24000,
        color: "Gondwana Stone", bodyType: "SUV", engineCapacity: "3000cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "Land Rover", model: "Range Rover Velar R-Dynamic SE",
        year: 2021, vin: "SALYA2EX6MA012345", registrationNumber: "KEV 040N",
        fuelType: "diesel", transmission: "automatic", mileage: 39000,
        color: "Santorini Black", bodyType: "SUV", engineCapacity: "2000cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "Land Rover", model: "Discovery 5 HSE Luxury",
        year: 2020, vin: "SALRR2RVXLA012345", registrationNumber: "KEW 041O",
        fuelType: "diesel", transmission: "automatic", mileage: 48000,
        color: "Indus Silver", bodyType: "SUV", engineCapacity: "3000cc",
        createdBy: dealers[5]._id, createdByRole: "dealer",
    },

    // ── Hyundai ──────────────────────────────────────────────────────────────
    {
        make: "Hyundai", model: "Tucson 1.6 T-GDi",
        year: 2022, vin: "TMAJ3812XNJ012345", registrationNumber: "KEX 042P",
        fuelType: "petrol", transmission: "automatic", mileage: 21000,
        color: "Phantom Black", bodyType: "SUV", engineCapacity: "1600cc",
        createdBy: dealers[7]._id, createdByRole: "dealer",
    },
    {
        make: "Hyundai", model: "Ioniq 5 Premium AWD",
        year: 2023, vin: "KMHPX4AE0PA012345", registrationNumber: "KEY 043Q",
        fuelType: "electric", transmission: "automatic", mileage: 7500,
        color: "Lucid Blue", bodyType: "crossover", engineCapacity: "electric",
        createdBy: dealers[3]._id, createdByRole: "dealer",
    },
    {
        make: "Hyundai", model: "Santa Fe 2.2 CRDi",
        year: 2021, vin: "KM8SRDHF3MU012345", registrationNumber: "KEZ 044R",
        fuelType: "diesel", transmission: "automatic", mileage: 44000,
        color: "Glowing Yellow", bodyType: "SUV", engineCapacity: "2200cc",
        createdBy: dealers[9]._id, createdByRole: "dealer",
    },

    // ── Kia ──────────────────────────────────────────────────────────────────
    {
        make: "Kia", model: "Sportage GT-Line 1.6T",
        year: 2022, vin: "U5YPG81A3NL012345", registrationNumber: "KFA 045S",
        fuelType: "petrol", transmission: "automatic", mileage: 18000,
        color: "Snow White Pearl", bodyType: "SUV", engineCapacity: "1600cc",
        createdBy: dealers[7]._id, createdByRole: "dealer",
    },
    {
        make: "Kia", model: "Telluride SX",
        year: 2021, vin: "5XYP64HC3MG012345", registrationNumber: "KFB 046T",
        fuelType: "petrol", transmission: "automatic", mileage: 32000,
        color: "Gravity Gray", bodyType: "SUV", engineCapacity: "3500cc",
        createdBy: dealers[2]._id, createdByRole: "dealer",
    },
    {
        make: "Kia", model: "EV6 GT-Line",
        year: 2023, vin: "KNDC341GXP5012345", registrationNumber: "KFC 047U",
        fuelType: "electric", transmission: "automatic", mileage: 6200,
        color: "Aurora Black Pearl", bodyType: "crossover", engineCapacity: "electric",
        createdBy: dealers[3]._id, createdByRole: "dealer",
    },

    // ── Mazda ────────────────────────────────────────────────────────────────
    {
        make: "Mazda", model: "CX-5 Skyactiv-D AWD",
        year: 2021, vin: "JM3KFBCM0M1012345", registrationNumber: "KFD 048V",
        fuelType: "diesel", transmission: "automatic", mileage: 41000,
        color: "Soul Red Crystal", bodyType: "SUV", engineCapacity: "2200cc",
        createdBy: dealers[4]._id, createdByRole: "dealer",
    },
    {
        make: "Mazda", model: "MX-5 RF Sport",
        year: 2020, vin: "JM1NDBL79L0012345", registrationNumber: "KFE 049W",
        fuelType: "petrol", transmission: "manual", mileage: 23000,
        color: "Machine Gray Metallic", bodyType: "convertible", engineCapacity: "2000cc",
        createdBy: dealers[9]._id, createdByRole: "dealer",
    },
    {
        make: "Mazda", model: "CX-9 Signature",
        year: 2022, vin: "JM3TCBEY0N0012345", registrationNumber: "KFF 050X",
        fuelType: "petrol", transmission: "automatic", mileage: 16000,
        color: "Polymetal Gray", bodyType: "SUV", engineCapacity: "2500cc",
        createdBy: dealers[5]._id, createdByRole: "dealer",
    },

    // ── Isuzu ────────────────────────────────────────────────────────────────
    {
        make: "Isuzu", model: "D-Max LS-E 4x4",
        year: 2022, vin: "PADTFS8DX012345", registrationNumber: "KFG 051Y",
        fuelType: "diesel", transmission: "automatic", mileage: 27000,
        color: "Sapphire Blue", bodyType: "pickup", engineCapacity: "1900cc",
        createdBy: dealers[6]._id, createdByRole: "dealer",
    },
    {
        make: "Isuzu", model: "mu-X LS-A",
        year: 2021, vin: "MADRFS8DX012345", registrationNumber: "KFH 052Z",
        fuelType: "diesel", transmission: "automatic", mileage: 39000,
        color: "Pearl White", bodyType: "SUV", engineCapacity: "1900cc",
        createdBy: dealers[7]._id, createdByRole: "dealer",
    },

    // ── Peugeot ──────────────────────────────────────────────────────────────
    {
        make: "Peugeot", model: "3008 GT Hybrid4",
        year: 2022, vin: "VF3MCYHZPLS012345", registrationNumber: "KFI 053A",
        fuelType: "hybrid", transmission: "automatic", mileage: 14000,
        color: "Celebes Blue", bodyType: "SUV", engineCapacity: "1600cc",
        createdBy: dealers[2]._id, createdByRole: "dealer",
    },

    // ── Audi ─────────────────────────────────────────────────────────────────
    {
        make: "Audi", model: "Q5 45 TFSI Quattro",
        year: 2021, vin: "WA1BNAFY8M2012345", registrationNumber: "KFJ 054B",
        fuelType: "petrol", transmission: "automatic", mileage: 36000,
        color: "Florett Silver", bodyType: "SUV", engineCapacity: "2000cc",
        createdBy: dealers[3]._id, createdByRole: "dealer",
    },
    {
        make: "Audi", model: "A6 50 TDI Quattro",
        year: 2020, vin: "WAUZZZ4G1LN012345", registrationNumber: "KFK 055C",
        fuelType: "diesel", transmission: "automatic", mileage: 58000,
        color: "Daytona Gray", bodyType: "sedan", engineCapacity: "3000cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "Audi", model: "e-tron Sportback 55 Quattro",
        year: 2022, vin: "WA1LAAGE4NB012345", registrationNumber: "KFL 056D",
        fuelType: "electric", transmission: "automatic", mileage: 21000,
        color: "Plasma Blue", bodyType: "SUV", engineCapacity: "electric",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },

    // ── Lexus ────────────────────────────────────────────────────────────────
    {
        make: "Lexus", model: "LX 600 F Sport",
        year: 2022, vin: "JTJBM7FX8N5012345", registrationNumber: "KFM 057E",
        fuelType: "petrol", transmission: "automatic", mileage: 13000,
        color: "Sonic Titanium", bodyType: "SUV", engineCapacity: "3500cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "Lexus", model: "RX 350 F Sport",
        year: 2020, vin: "JTJBZMCA1L2012345", registrationNumber: "KFN 058F",
        fuelType: "petrol", transmission: "automatic", mileage: 44000,
        color: "Eminent White Pearl", bodyType: "SUV", engineCapacity: "3500cc",
        createdBy: dealers[5]._id, createdByRole: "dealer",
    },

    // ── Jeep ─────────────────────────────────────────────────────────────────
    {
        make: "Jeep", model: "Wrangler Rubicon 392",
        year: 2022, vin: "1C4HJXFG4NW012345", registrationNumber: "KFO 059G",
        fuelType: "petrol", transmission: "automatic", mileage: 17000,
        color: "Hydro Blue Pearl", bodyType: "SUV", engineCapacity: "6400cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "Jeep", model: "Grand Cherokee L Summit Reserve",
        year: 2022, vin: "1C4RJKBG2N8012345", registrationNumber: "KFP 060H",
        fuelType: "petrol", transmission: "automatic", mileage: 24000,
        color: "Diamond Black Crystal", bodyType: "SUV", engineCapacity: "5700cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },

    // ── Volvo ────────────────────────────────────────────────────────────────
    {
        make: "Volvo", model: "XC90 Recharge T8 Ultimate",
        year: 2023, vin: "YV4A22PK4P1012345", registrationNumber: "KFQ 061I",
        fuelType: "hybrid", transmission: "automatic", mileage: 8000,
        color: "Crystal White Pearl", bodyType: "SUV", engineCapacity: "2000cc",
        createdBy: dealers[8]._id, createdByRole: "dealer",
    },
    {
        make: "Volvo", model: "XC60 B5 AWD R-Design",
        year: 2021, vin: "YV4A22RKXM1012345", registrationNumber: "KFR 062J",
        fuelType: "petrol", transmission: "automatic", mileage: 33000,
        color: "Onyx Black", bodyType: "SUV", engineCapacity: "2000cc",
        createdBy: dealers[5]._id, createdByRole: "dealer",
    },
];

// ─── Seed Data — Inspections ─────────────────────────────────────────────────

const buildInspectionData = (vehicles, inspectors) => {
    const checklistResult = () => pick(["pass", "fail", "attention"]);

    const biasedResult = (bias) => {
        const r = Math.random();
        if (bias === "excellent") return r < 0.85 ? "pass" : r < 0.95 ? "attention" : "fail";
        if (bias === "good") return r < 0.65 ? "pass" : r < 0.88 ? "attention" : "fail";
        if (bias === "fair") return r < 0.40 ? "pass" : r < 0.75 ? "attention" : "fail";
        return r < 0.20 ? "pass" : r < 0.55 ? "attention" : "fail"; // poor
    };

    const noteTemplates = [
        "Vehicle presented in good overall condition. Minor surface scratches noted on rear bumper.",
        "Engine runs smoothly with no unusual noises. Service history verified and up to date.",
        "Recent brake pad replacement confirmed. Tyres show even wear with adequate tread depth.",
        "Full service carried out at authorized dealer 2,000 km ago. Documents available.",
        "Minor oil seepage at valve cover gasket — monitoring recommended at next service.",
        "Suspension components in good order. No knocking or play detected under load.",
        "Vehicle imported directly from Japan. Low mileage confirmed via service records.",
        "Rust noted on undercarriage near rear wheel arches — structural integrity intact.",
        "Air conditioning recently recharged. All climate control functions operating normally.",
        "Slight misalignment on front axle. Wheel alignment recommended within 5,000 km.",
        "All electronics and infotainment systems functioning correctly. No DTC codes detected.",
        "Minor dent on driver-side door — does not affect functionality or structural rigidity.",
        "Engine bay clean and dry. No signs of oil leaks, coolant loss, or past overheating.",
        "Gearbox fluid fresh and at correct level. Gear changes smooth across all ratios.",
        "Vehicle history checked against Kenya NTSA database — no accident records found.",
        "Battery health at 94% of original capacity (EV). Charging port in excellent condition.",
        "Alloy wheels show curb rash on two rims — cosmetic only, no structural damage.",
        "Comprehensive inspection completed. Vehicle highly recommended for purchase.",
    ];

    return vehicles.map((vehicle, i) => {
        const condition = pick(["excellent", "good", "good", "fair", "poor"]);
        const status = pick(["submitted", "submitted", "verified"]);
        const hash = randomHash();
        const inspector = inspectors[i % inspectors.length];

        // Vehicle schema has no mileage field — generate a standalone realistic value
        const mileage = randInt(5000, 130000);

        return {
            vehicleId: vehicle._id,
            inspectorId: inspector._id,
            hash,
            condition,
            status,
            blockchainStatus: status === "verified"
                ? pick(["submitted", "confirmed"])
                : "pending",
            mileage,
            inspectionDate: randDate(365, 7),   // required; createdAt is auto-set by timestamps
            notes: noteTemplates[i % noteTemplates.length],
            // Exactly the 8 checklist fields in the Inspection schema
            checklist: {
                engine: biasedResult(condition),
                transmission: biasedResult(condition),
                brakes: biasedResult(condition),
                suspension: biasedResult(condition),
                electricals: biasedResult(condition),
                bodywork: biasedResult(condition),
                interior: biasedResult(condition),
                tyres: biasedResult(condition),
            },
        };
    });
};

// ─── Seed Data — Verifications ───────────────────────────────────────────────

const buildVerificationData = (inspections, vehicles) => {
    // Only verify inspections that have status "verified"
    const eligible = inspections.filter((ins) => ins.status === "verified");

    return eligible.map((inspection, i) => {
        const vehicle = vehicles.find((v) => v._id.equals(inspection.vehicleId));
        return {
            inspectionId: inspection._id,
            vehicleId: vehicle._id,
            hash: inspection.hash,
            transactionHash: randomTxHash(),
            network: pick(["polygon", "polygon", "ethereum"]),
            status: pick(["confirmed", "confirmed", "pending"]),
            // blockNumber and confirmedAt are not in the Verification schema
            timestamp: randDate(180, 1),
        };
    });
};

// ─── Seeder Function ─────────────────────────────────────────────────────────

async function seed() {
    console.log("\n🌱  Meraki AutoChain — Database Seeder");
    console.log("━".repeat(55));

    // 1. Connect
    console.log("\n⏳  Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  Connected to MongoDB");

    // 2. Clear existing data
    console.log("\n🗑️   Clearing existing collections...");
    await Promise.all([
        User.deleteMany({}),
        Vehicle.deleteMany({}),
        Inspection.deleteMany({}),
        Verification.deleteMany({}),
        Share.deleteMany({}),
    ]);
    console.log("✅  All collections cleared");

    // ── 3. Seed Users ────────────────────────────────────────────────────────
    console.log("\n👤  Seeding Users...");
    const seededUsers = [];
    for (const data of userData) {
        const user = await new User(data).save();
        seededUsers.push(user);
    }

    const adminUsers = seededUsers.filter((u) => u.role === "admin");
    const inspectorUsers = seededUsers.filter((u) => u.role === "inspector");
    const dealerUsers = seededUsers.filter((u) => u.role === "dealer" && u.partnerStatus === "approved");
    const ownerUsers = seededUsers.filter((u) => u.role === "user");
    const regularUsers = seededUsers.filter((u) => u.role === "insurance");

    console.log(`✅  Users seeded! (${seededUsers.length} total)`);
    console.log(`    → ${adminUsers.length} admins, ${inspectorUsers.length} inspectors, ${dealerUsers.length} approved dealers, ${ownerUsers.length} vehicle owners, ${regularUsers.length} insurance users`);

    // ── 4. Seed Vehicles ─────────────────────────────────────────────────────
    console.log("\n🚗  Seeding Vehicles...");
    const vehicleData = buildVehicleData(dealerUsers, inspectorUsers, ownerUsers);
    const seededVehicles = [];
    for (const data of vehicleData) {
        const vehicle = await new Vehicle(data).save();
        seededVehicles.push(vehicle);
    }
    console.log(`✅  Vehicles seeded! (${seededVehicles.length} total)`);

    // ── 5. Seed Inspections ──────────────────────────────────────────────────
    console.log("\n🔍  Seeding Inspections...");
    const inspectionData = buildInspectionData(seededVehicles, inspectorUsers);
    const seededInspections = [];
    for (const data of inspectionData) {
        const inspection = await new Inspection(data).save();
        seededInspections.push(inspection);
    }
    console.log(`✅  Inspections seeded! (${seededInspections.length} total)`);

    // ── 6. Seed Verifications ────────────────────────────────────────────────
    console.log("\n🔗  Seeding Verifications...");
    const verificationData = buildVerificationData(seededInspections, seededVehicles);
    const seededVerifications = [];
    for (const data of verificationData) {
        const verification = await new Verification(data).save();
        seededVerifications.push(verification);
    }
    console.log(`✅  Verifications seeded! (${seededVerifications.length} total)`);

    // ── Summary ──────────────────────────────────────────────────────────────
    const verifiedCount = seededInspections.filter((i) => i.status === "verified").length;
    const confirmedVerifications = verificationData.filter((v) => v.status === "confirmed").length;

    console.log("\n" + "━".repeat(55));
    console.log("🎉  Seeding complete! Summary:");
    console.log(`    Users              → ${seededUsers.length}`);
    console.log(`      ↳ Admins         → ${adminUsers.length}`);
    console.log(`      ↳ Inspectors     → ${inspectorUsers.length}`);
    console.log(`      ↳ Dealers        → ${dealerUsers.length} approved + 2 pending/rejected`);
    console.log(`      ↳ Insurance users → ${regularUsers.length}`);
    console.log(`    Vehicles           → ${seededVehicles.length}`);
    console.log(`    Inspections        → ${seededInspections.length} (${verifiedCount} verified)`);
    console.log(`    Verifications      → ${seededVerifications.length} (${confirmedVerifications} confirmed on-chain)`);
    console.log("━".repeat(55));

    // ── Credential reminder ───────────────────────────────────────────────────
    console.log("\n🔑  Test credentials:");
    console.log("    ┌─────────────────────────────────────────────────────────┐");
    console.log("    │  Role       Email                        Password        │");
    console.log("    ├─────────────────────────────────────────────────────────┤");
    console.log("    │  admin      admin@meraki.co.ke           password123     │");
    console.log("    │  admin      fatuma.ochieng@meraki.co.ke  password123     │");
    console.log("    │  inspector  james.mwangi@meraki.co.ke    password123     │");
    console.log("    │  inspector  grace.achieng@meraki.co.ke   password123     │");
    console.log("    │  inspector  brian.kamau@meraki.co.ke     password123     │");
    console.log("    │  inspector  lucy.wanjiku@meraki.co.ke    password123     │");
    console.log("    │  inspector  samuel.otieno@meraki.co.ke   password123     │");
    console.log("    │  inspector  mercy.njeri@meraki.co.ke     password123     │");
    console.log("    │  inspector  david.kipchoge@meraki.co.ke  password123     │");
    console.log("    │  inspector  amina.hassan@meraki.co.ke    password123     │");
    console.log("    │  dealer     sales@nairobiauto.co.ke      password123     │");
    console.log("    │  dealer     info@eastlandsmotors.co.ke   password123     │");
    console.log("    │  dealer     sales@mombasaroadautos.co.ke password123     │");
    console.log("    │  dealer     info@westlandspremier.co.ke  password123     │");
    console.log("    │  dealer     sales@thikaroad.co.ke        password123     │");
    console.log("    │  dealer     info@kisumulakemotors.co.ke  password123     │");
    console.log("    │  dealer     sales@nakuruvalley.co.ke     password123     │");
    console.log("    │  dealer     info@eldoretspeed.co.ke      password123     │");
    console.log("    │  dealer     sales@karenluxury.co.ke      password123     │");
    console.log("    │  dealer     info@ngongroadcars.co.ke     password123     │");
    console.log("    │  dealer     pato@gmail.com               pato@2026!      │");
    console.log("    │  user       peter.njoroge@gmail.com      password123     │");
    console.log("    │  user       wanjiru.kariuki@gmail.com    password123     │");
    console.log("    └─────────────────────────────────────────────────────────┘");
    console.log("");
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

seed()
    .then(() => {
        mongoose.connection.close();
        process.exit(0);
    })
    .catch((err) => {
        console.error("\n❌  Seeding failed:", err.message);
        console.error(err);
        mongoose.connection.close();
        process.exit(1);
    });
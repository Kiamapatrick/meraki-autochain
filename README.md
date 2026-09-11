# Meraki AutoChain

**Vehicle Inspection & Trust Infrastructure — Built for Kenya**

Meraki AutoChain is a blockchain-anchored vehicle verification platform that creates tamper-proof, permanent records for vehicle inspections, ownership history, and condition reports. Designed for the Kenyan automotive market, it bridges traditional vehicle documentation with Web3 transparency.

---

##  Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Smart Contract** | Solidity (Polygon/Amoy) | Immutable hash anchor for inspection records |
| **Backend API** | Node.js + Express + MongoDB | Full record storage, auth, business logic |
| **Partner Portal** | Vanilla JS + CSS | Inspector, Dealer, Insurance dashboards |
| **User Portal** | Vanilla JS + CSS | Vehicle owner dashboard, passports, sharing |

---

##  Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MERAKI AUTOCHAIN                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   INSPECTOR  │    │    DEALER    │    │  INSURANCE   │     │
│  │   (Portal)   │    │   (Portal)   │    │   (Portal)   │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                   │                   │              │
│         └───────────────────┼───────────────────┘              │
│                             ▼                                  │
│                    ┌─────────────────┐                         │
│                    │  REST API       │                         │
│                    │  (Node/Express) │                         │
│                    └────────┬────────┘                         │
│                             │                                  │
│              ┌──────────────┼──────────────┐                  │
│              ▼              ▼              ▼                  │
│       ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│       │  MongoDB   │ │  Polygon   │ │   Files    │           │
│       │  (Records) │ │  (Anchors) │ │  (Images)  │           │
│       └────────────┘ └────────────┘ └────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle**: The blockchain stores **hashes only** (SHA-256 of inspection JSON). Full records live in MongoDB. Anyone can verify by hashing a record and calling `verifyInspection()` on-chain.

---

##  Project Structure

```
meraki-autochain/
├── backend/                      # Node.js API
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/             # Route handlers
│   │   ├── auth.controller.js
│   │   ├── vehicle.controller.js
│   │   ├── inspector.controller.js
│   │   ├── dealer.controller.js
│   │   ├── insurance.controller.js
│   │   └── sharing.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification
│   │   └── role.middleware.js   # RBAC (inspector/dealer/insurance/user)
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── Inspection.js
│   │   ├── Share.js
│   │   └── Verification.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── vehicle.routes.js
│   │   ├── inspector.routes.js
│   │   ├── dealer.routes.js
│   │   ├── insurance.routes.js
│   │   ├── sharing.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   ├── blockchain.service.js # Web3 interaction
│   │   └── hash.service.js      # SHA-256 canonicalization
│   ├── utils/
│   │   └── generateId.js        # Meraki ID generator (MC-XXXXXX)
│   ├── uploads/inspections/     # Inspection photos (gitignored)
│   ├── server.js                # Entry point
│   ├── seed.js                  # Database seeder
│   └── package.json
│
├── frontend/                     # Partner Portal (Inspector/Dealer/Insurance)
│   ├── css/
│   │   ├── global.css
│   │   ├── auth.css
│   │   ├── dealer.css
│   │   ├── inspector.css
│   │   └── insurance.css
│   ├── js/
│   │   ├── auth/login.js
│   │   ├── partner/             # Shared partner logic
│   │   │   ├── router.js
│   │   │   └── sidebar.js
│   │   ├── dealer/
│   │   ├── inspector/
│   │   └── insurance/
│   ├── pages/partner/
│   │   ├── login.html
│   │   ├── dealer/
│   │   ├── inspector/
│   │   └── insurance/
│   ├── sol/
│   │   └── MerakiAutoChain.sol  # Smart contract
│   └── index.html               # Role-based redirect
│
├── meraki-user-portal/          # Vehicle Owner Portal
│   ├── css/
│   ├── js/
│   │   ├── shared/              # Auth, API, Router
│   │   └── user/                # Dashboard, Vehicles, Passport, Sharing
│   └── pages/user/
│       ├── index.html           # Login
│       ├── dashboard.html
│       ├── vehicles.html
│       ├── vehicle-passport.html
│       ├── shared-access.html
│       └── profile.html
│
└── README.md
```

---

##  Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Polygon RPC URL (Alchemy/Infura/QuickNode)
- Wallet private key for operator (backend signer)

### Backend Setup
```bash
cd backend
cp .env.example .env   # Create and configure
npm install
npm run dev            # Starts on http://localhost:5000
```

### Environment Variables (backend/.env)
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Database
MONGODB_URI=mongodb://localhost:27017/meraki-autochain

# Auth
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Blockchain
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
OPERATOR_PRIVATE_KEY=0x...          # Backend signer wallet
CONTRACT_ADDRESS=0x...              # Deployed contract address

# File Upload
MAX_FILE_SIZE=10485760              # 10MB
UPLOAD_PATH=./uploads/inspections
```

### Smart Contract Deployment
```bash
# Using Hardhat/Foundry - deploy MerakiAutoChain.sol to Polygon Amoy
# Then call addOperator() with your backend wallet address
```

### Frontend (Partner Portal)
```bash
cd frontend
# Serve with any static server:
npx serve .              # or python -m http.server 8080
# Opens at http://localhost:8080 → redirects to login
```

### User Portal
```bash
cd meraki-user-portal
npx serve pages/user     # Serves user portal at http://localhost:3000
```

---

##  Roles & Permissions

| Role | Portal | Capabilities |
|------|--------|--------------|
| **Inspector** | Partner | Create inspections, upload photos, anchor to chain |
| **Dealer** | Partner | View vehicle passports, request access, manage inventory |
| **Insurance** | Partner | View inspection history, generate reports, risk assessment |
| **User** | User Portal | View own vehicles, download passports, share access |

---

##  API Endpoints

### Authentication
```
POST   /api/auth/register           # Register (user/inspector/dealer/insurance)
POST   /api/auth/login              # Login → JWT
GET    /api/auth/me                 # Current user profile
POST   /api/auth/refresh            # Refresh token
```

### Vehicles
```
POST   /api/vehicles                # Register vehicle (inspector)
GET    /api/vehicles/:merakiId      # Get vehicle + full history
GET    /api/vehicles                # List (filtered by role)
```

### Inspections (Inspector only)
```
POST   /api/inspector/inspections              # Create inspection
POST   /api/inspector/inspections/:id/photos   # Upload photos
POST   /api/inspector/inspections/:id/anchor   # Anchor to blockchain
GET    /api/inspector/inspections              # My inspections
```

### Dealer
```
GET    /api/dealer/requests                  # Access requests
POST   /api/dealer/requests                  # Request vehicle access
GET    /api/dealer/inventory                 # Managed vehicles
```

### Insurance
```
GET    /api/insurance/vehicles/:merakiId/report   # Risk report
GET    /api/insurance/dashboard                   # Portfolio view
```

### Sharing (User only)
```
POST   /api/sharing                    # Create share link
GET    /api/sharing/:token             # View shared passport
DELETE /api/sharing/:id                # Revoke access
```

### User Portal
```
GET    /api/user/dashboard             # My vehicles summary
GET    /api/user/vehicles              # My vehicles list
GET    /api/user/vehicles/:merakiId/passport  # Download passport PDF
GET    /api/user/profile               # Profile settings
```

---

##  Smart Contract (MerakiAutoChain.sol)

### Core Functions

| Function | Access | Description |
|----------|--------|-------------|
| `registerVehicle(merakiId, vinHash)` | Operator | Register new vehicle |
| `recordInspection(merakiId, recordHash)` | Operator | Anchor inspection hash |
| `verifyInspection(recordHash)` | Public | Verify hash exists on-chain |
| `getVehicle(merakiId)` | Public | Get registration details |
| `getInspectionHashes(merakiId)` | Public | All inspection hashes for vehicle |
| `isVehicleVerified(merakiId)` | Public | Quick verification check |
| `addOperator(address)` | Owner | Authorize backend wallet |
| `deactivateVehicle(merakiId)` | Operator | Mark vehicle inactive |

### Verification Flow
```javascript
// Backend creates inspection record
const inspection = { ... };

// Canonicalize & hash
const canonical = JSON.stringify(inspection, Object.keys(inspection).sort());
const recordHash = ethers.keccak256(ethers.toUtf8Bytes(canonical));

// Anchor on-chain
await contract.recordInspection(merakiId, recordHash);

// Anyone can verify later
const [exists, timestamp, inspector, index] = await contract.verifyInspection(recordHash);
```

---

##  Testing

```bash
# Backend
cd backend
npm test              # (Add tests first)

# Contract
cd frontend
npx hardhat test      # If using Hardhat
```

---

##  Deployment

### Backend (Railway/Render/AWS)
1. Set all environment variables
2. Build: `npm install --production`
3. Start: `npm start`
4. Health check: `GET /api/health`

### Frontend (Vercel/Netlify/Cloudflare Pages)
- Deploy `frontend/` as static site
- Configure rewrite: all paths → `index.html` (SPA routing)
- Set `FRONTEND_URL` in backend CORS

### User Portal
- Deploy `meraki-user-portal/pages/user/` as static site
- Separate domain/subdomain recommended

### Smart Contract
- Deploy to Polygon Mainnet or Amoy Testnet
- Verify on Polygonscan
- Call `addOperator(backendWallet)` after deployment

---

##  Kenya-Specific Features

- **NTSA Integration Ready**: Vehicle registration fields align with NTSA data
- **Meraki ID Format**: `MC-XXXXXX` (Kenya-friendly prefix)
- **Mobile-First**: Optimized for mobile browsers common in Kenya
- **Offline-Capable**: User portal works with intermittent connectivity
- **M-Pesa Ready**: Payment integration points for premium features

---

##  Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

##  License

MIT License — see [LICENSE](LICENSE) for details.

---

##  Contact

**Meraki AutoChain Ltd.**  
Nairobi, Kenya  
Email: hello@merakiautochain.com  
Website: https://merakiautochain.com

---

*Built with ❤️ for transparent vehicle ownership in Kenya*
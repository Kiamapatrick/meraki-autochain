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
│   │   ├── sharing.controller.js
│   │   └── user.controller.js   # Profile, password, sessions, deletion
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification + tokenVersion invalidation
│   │   └── role.middleware.js   # RBAC (inspector/dealer/insurance/user)
│   ├── models/
│   │   ├── User.js              # tokenVersion for session invalidation
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
│   │   ├── blockchain.service.js # Web3 interaction (registerVehicleOnChain, createProof, etc.)
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
│   ├── js/
│   │   ├── auth/login.js
│   │   ├── partner/             # Shared partner logic
│   │   │   ├── router.js
│   │   │   └── sidebar.js
│   │   ├── dealer/
│   │   ├── inspector/
│   │   └── insurance/
│   ├── pages/partner/
│   ├── sol/
│   │   └── MerakiAutoChain.sol  # Smart contract
│   └── index.html               # Role-based redirect
│
├── meraki-user-portal/          # Vehicle Owner Portal (Complete)
│   ├── css/
│   │   ├── global.css           # Design system + accessibility
│   │   ├── user.css             # Dashboard, vehicles, activity
│   │   ├── passport.css         # Vehicle passport layout
│   │   ├── sharing.css          # Share access page
│   │   ├── profile.css          # Profile page
│   │   ├── add-vehicle.css      # Multi-step form wizard
│   │   ├── shared-passport.css  # Public shared passport
│   │   └── verify.css           # Public verification
│   ├── js/
│   │   ├── shared/              # Core modules
│   │   │   ├── api.js           # API client (all endpoints)
│   │   │   ├── auth.js          # Session management
│   │   │   ├── router.js        # Route guards
│   │   │   ├── toast.js         # Notification system
│   │   │   ├── mobile-sidebar.js # Hamburger drawer
│   │   │   └── modal.js         # Confirm/alert/danger modals
│   │   └── user/                # Page-specific logic
│   │       ├── dashboard.js     # Stats, recent vehicles, activity feed
│   │       ├── vehicles.js      # Filterable vehicle grid
│   │       ├── passport.js      # Dynamic passport rendering
│   │       ├── sharing.js       # Share code generation/revocation
│   │       ├── profile.js       # Profile, password, sessions, deletion
│   │       ├── add-vehicle.js   # 3-step form wizard
│   │       ├── shared-passport.js # Public view (no auth)
│   │       └── verify.js        # Public verification (localStorage history)
│   └── pages/user/
│       ├── index.html           # Login
│       ├── dashboard.html       # Overview + stats + activity
│       ├── vehicles.html        # Garage with filters
│       ├── vehicle-passport.html # Full passport (dynamic)
│       ├── shared-access.html   # Generate/revoke share codes
│       ├── profile.html         # Profile, password, sessions, deletion
│       ├── add-vehicle.html     # 3-step wizard
│       ├── shared-passport.html # Public shared view (no login)
│       └── verify.html          # Public Meraki ID verification
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
npx serve .              # Serves from repo root (absolute paths)
# Opens at http://localhost:3000/pages/user/index.html
```

> **Note**: The user portal uses absolute paths (`/meraki-user-portal/...`) so serve from the repo root, not the pages/user subdirectory.

---

##  Roles & Permissions

| Role | Portal | Capabilities |
|------|--------|--------------|
| **Inspector** | Partner | Create inspections, upload photos, anchor to chain |
| **Dealer** | Partner | View vehicle passports, request access, manage inventory |
| **Insurance** | Partner | View inspection history, generate reports, risk assessment |
| **User** | User Portal | View own vehicles, download passports, share access |

---

##  User Portal Features (Complete)

| Feature | Page | Description |
|---------|------|-------------|
| **Authentication** | `index.html` | Email/password login, role validation, redirect to dashboard |
| **Dashboard** | `dashboard.html` | Stats, recent vehicles, activity feed from inspections |
| **Vehicle Garage** | `vehicles.html` | Filterable grid (All/Verified/Pending), view passport, share |
| **Vehicle Passport** | `vehicle-passport.html` | Full passport: identity, timeline, verification panel, mileage |
| **Share Access** | `shared-access.html` | Generate/revoke share codes, list active codes |
| **Profile** | `profile.html` | Edit name/phone, change password, revoke all sessions, delete account (soft) |
| **Add Vehicle** | `add-vehicle.html` | 3-step wizard (Basic Info → Specs → Review) |
| **Public Shared Passport** | `shared-passport.html` | View via share code (no login), copy link, print |
| **Public Verify** | `verify.html` | Enter Meraki ID → on-chain verification status, recent searches |

**Shared Components:**
- **Toast notifications** — success/error/info toasts
- **Mobile sidebar** — hamburger drawer (≤900px), focus trap, ESC to close
- **Modal system** — confirm, alert, danger modals with focus management
- **Route guards** — `requireUser()` / `requireGuest()` with relative redirects
- **Toast** — `Toast.success()`, `Toast.error()`, `Toast.info()`

---

##  API Endpoints

### Authentication
```
POST   /api/auth/register           # Register (user/inspector/dealer/insurance)
POST   /api/auth/login              # Login → JWT (includes tokenVersion)
GET    /api/auth/me                 # Current user profile
```

### Vehicles
```
POST   /api/vehicles                # Create vehicle (owner) → registers on-chain
GET    /api/vehicles/my             # List owner's vehicles
GET    /api/vehicles/:merakiId      # Get vehicle details (owner)
GET    /api/vehicles/:merakiId/passport # Full passport (vehicle + inspections + verifications)
GET    /api/vehicles/:merakiId/share  # Generate share code (owner)
GET    /api/vehicles/:merakiId/shares # List share codes for vehicle
```

### Inspections (Inspector only)
```
POST   /api/inspector/inspections              # Create inspection
POST   /api/inspector/inspections/:id/photos   # Upload photos
POST   /api/inspector/inspections/:id/anchor   # Anchor to blockchain
GET    /api/inspector/inspections              # My inspections
```

### Sharing (User + Public)
```
POST   /api/vehicles/:id/share          # Generate share code (owner)
GET    /api/sharing/all                  # All active codes (owner)
POST   /api/sharing/revoke               # Revoke code (owner)
GET    /api/sharing/:code                # Public: view shared passport (no auth)
```

### Verification (Public)
```
GET    /api/verify/:merakiId            # Public: on-chain verification (no auth)
```

### User Profile
```
GET    /api/user/profile                # Get profile
PUT    /api/user/profile                # Update name/phone
PUT    /api/user/password               # Change password (revokes other sessions)
POST   /api/user/revoke-all             # Revoke all sessions
DELETE /api/user/account                # Soft delete account
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
- Deploy `meraki-user-portal/` as static site (serve from repo root)
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

##  Accessibility & Responsiveness

- **WCAG AA** color contrast (design tokens)
- **Skip links** on all pages
- **Focus management** in modals/drawer
- **Reduced motion** support (`prefers-reduced-motion`)
- **High contrast** mode support (`prefers-contrast: high`)
- **Screen reader** utilities (`.sr-only`)
- **Responsive breakpoints**: 1000px, 900px, 860px, 768px, 640px, 560px, 480px
- **Print styles** for passports

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
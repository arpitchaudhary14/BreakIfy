# BreakIfy

> **Shorten. Track. Share.**  
> High-performance, privacy-conscious URL shortening, dynamic QR codes, real-time analytics intelligence, and link management platform.

---

### 🌐 Live Demo Here
👉 **[BreakIfy Live Application](https://breakify.site)**  
*Production deployment running globally on Cloudflare Pages and Azure with MongoDB Atlas.*

---

## 🐳 Docker Images

Production-ready, multi-stage Docker images are officially hosted on Docker Hub for both backend and frontend services:

| Component | Docker Hub Repository | Pull Command | Status |
| :--- | :--- | :--- | :--- |
| **Frontend (React + Nginx)** | [arpit00011/breakify-frontend](https://hub.docker.com/r/arpit00011/breakify-frontend) | `docker pull arpit00011/breakify-frontend:latest` | `Active & Public` |
| **Backend (Node.js API)** | [arpit00011/breakify-backend](https://hub.docker.com/r/arpit00011/breakify-backend) | `docker pull arpit00011/breakify-backend:latest` | `Active & Public` |

You can run the full pre-built stack directly using Docker Compose without building from source:

```bash
# Pull latest images from Docker Hub
docker pull arpit00011/breakify-backend:latest
docker pull arpit00011/breakify-frontend:latest

# Start all services (MongoDB + Backend + Frontend)
docker compose up -d
```

---

## 🚀 Key Features

* **Instant Link Shortening:** Generates clean, high-entropy 7-character Base62 alphanumeric slugs (`/mvr9fFG`) with sub-20ms database-indexed redirect resolution.
* **Custom Aliases & Slugs:** Claim branded human-readable slugs for high-visibility marketing and social campaigns.
* **Dynamic QR Code Studio:** Generate live scannable QR codes with custom foreground/background colors, contrast safety validation, error correction levels (L/M/Q/H), and 1-click PNG and SVG downloads.
* **Deep Real-Time Analytics:** Live tracking of link impressions, click timestamps, browser engines, operating systems, and direct one-click CSV metrics report downloads.
* **Enterprise Authentication & 2FA:** User registration with Argon2id password hashing, RFC 6238 compliant TOTP two-factor authentication (Google Authenticator, Authy, 1Password), and 10 single-use emergency backup recovery codes.
* **Session Management:** Inspect active devices, user-agents, IP addresses, and revoke remote sessions on demand.
* **Recycle Bin & 30-Day Retention:** Soft-delete links to prevent accidental downtime; restore links instantly or permanently purge data with complete cleanup.
* **Link Security Controls:** Password-protect individual links and schedule expiration dates or maximum click limits.
* **Zero Third-Party Selling Pledge:** BreakIfy guarantees your data is never sold to brokers, advertisers, or third parties, and is never used to train machine learning models.

---

## 📁 Project Directory Structure

```text
BreakIfy/
├── assets/
│   └── images/
│       └── BreakIfy Logo.png        # Official brand logo
├── client/                          # React + Vite + TypeScript frontend
│   ├── public/                      # Static web assets
│   ├── src/
│   │   ├── __tests__/               # Frontend unit test suite
│   │   ├── components/              # UI design system (Card, Dialog, Button, etc.)
│   │   │   ├── layout/              # AppShell, Header, Sidebar, ThemeSelector
│   │   │   └── ui/                  # Reusable accessible atomic components
│   │   ├── context/                 # AuthContext & ThemeContext
│   │   ├── pages/                   # Application views
│   │   │   ├── auth/                # Login, Register, Forgot/Reset Password, 2FA
│   │   │   ├── links/               # My Links (Create, Edit, QR, Details)
│   │   │   ├── qr/                  # Dynamic QR Code Studio
│   │   │   ├── analytics/           # Real-time analytics dashboard
│   │   │   ├── history/             # Activity audit log
│   │   │   ├── recycle-bin/         # 30-day soft-delete retention
│   │   │   ├── settings/            # Account & security settings
│   │   │   └── public/              # Landing page, Terms, Privacy, Contact
│   │   ├── services/                # Axios/Fetch API clients
│   │   └── utils/                   # Formatting & helper utilities
│   ├── Dockerfile                   # Multi-stage production Nginx container
│   ├── nginx.conf                   # Reverse proxy & SPA routing config
│   ├── tailwind.config.ts           # Dark-first monochrome zinc palette
│   └── vite.config.ts
├── server/                          # Express + TypeScript backend
│   ├── src/
│   │   ├── __tests__/               # Vitest suite (142 unit & integration tests)
│   │   ├── config/                  # Environment variables & constants
│   │   ├── controllers/             # Request handlers & response formatting
│   │   ├── middlewares/             # Auth, rate-limit, error, and validation
│   │   ├── models/                  # Mongoose schemas (User, Link, ActivityLog, etc.)
│   │   ├── routes/                  # Express REST API routers
│   │   ├── services/                # Business logic, auth, and threat scanners
│   │   └── utils/                   # Argon2, TOTP, QR, crypto, logger
│   └── Dockerfile                   # Multi-stage Node.js production runner
├── docs/                            # Architecture and deployment guides
├── docker-compose.yml               # Multi-container production orchestration
├── package.json                     # Monorepo root script orchestrator
├── DEPLOYMENT.md                    # Production hosting & DNS playbook
├── SECURITY.md                      # Threat model & cryptographic audit
├── .dockerignore                    # Root Docker build ignore rules
├── .gitignore                       # Repository git ignore rules
├── LICENSE                          # BreakIfy software license
└── README.md                        # Project documentation
```

---

## 🛠️ Installation & Setup

### Prerequisites

Ensure you have the following installed on your machine:
* **Node.js:** `v20.x` or `v22.x` (LTS recommended)
* **npm:** `v10.x` or later
* **MongoDB:** `v7.0+` (local instance or MongoDB Atlas connection URI)
* **Docker & Docker Compose:** *(Optional, for containerized deployment)*

---

### Method 1: Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/arpitchaudhary14/BreakIfy.git
cd BreakIfy
```

#### 2. Install Dependencies
Install dependencies for both client and server:
```bash
# Install root monorepo tooling
npm install

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
cd ..
```

#### 3. Configure Environment Variables

**Backend (`server/.env`):**
Create `server/.env` from the provided example:
```bash
cp server/.env.example server/.env
```
Update values as required:
```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/breakify
JWT_ACCESS_SECRET=your-32-character-random-access-secret-key
JWT_REFRESH_SECRET=your-32-character-random-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
EMAIL_SERVICE=console
EMAIL_FROM=BreakIfy Security <security@breakify.site>
```

**Frontend (`client/.env`):**
Create `client/.env` from the provided example:
```bash
cp client/.env.example client/.env
```
Ensure the API endpoint is configured:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=BreakIfy
VITE_GOOGLE_CLIENT_ID=
```

#### 4. Run Development Servers
Open two terminal windows or run the monorepo scripts from the project root:

**Terminal 1 (Backend API):**
```bash
npm run dev:server
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
# Frontend client starts on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

### Method 2: Containerized Deployment (Docker Compose)

Deploy the entire stack (MongoDB + Express Backend + React Nginx Frontend) with a single command:

```bash
docker compose up -d --build
```

* **Frontend:** Accessible at `http://localhost:80` (or `http://localhost`)
* **Backend API:** Internally proxied via Nginx at `/api/v1`
* **MongoDB:** Securely isolated inside the internal `breakify-net` bridge network (port `27017` is not exposed publicly)

To stop the containers:
```bash
docker compose down
```

---

## 🧪 Testing & Quality Assurance

BreakIfy comes with a comprehensive test suite (unit, integration, and security tests):

```bash
# Run server test suite (Vitest - 142 tests passing)
npm run test:server

# Run client production build & TypeScript validation
npm run build:client

# Run full project build (both client & server)
npm run build
```

---

## 📡 REST API Reference

| Endpoint | Method | Authentication | Description |
| :--- | :---: | :---: | :--- |
| `POST /api/v1/auth/register` | `POST` | Public | Register new user account |
| `POST /api/v1/auth/login` | `POST` | Public | Authenticate user with password & cookie issuance |
| `POST /api/v1/auth/2fa/verify-login` | `POST` | Public | Verify TOTP code or emergency recovery code |
| `POST /api/v1/auth/logout` | `POST` | Authenticated | Revoke refresh token and clear auth cookies |
| `GET  /api/v1/auth/me` | `GET` | Authenticated | Fetch authenticated user profile & session |
| `POST /api/v1/links` | `POST` | Optional | Create short link (guest or authenticated) |
| `GET  /api/v1/links` | `GET` | Authenticated | List links with pagination, search, and sorting |
| `GET  /api/v1/links/export` | `GET` | Authenticated | Export link catalog and performance metrics as CSV |
| `PATCH /api/v1/links/:id` | `PATCH` | Authenticated | Update link destination, schedule, or password |
| `DELETE /api/v1/links/:id` | `DELETE` | Authenticated | Soft-delete link (moves to 30-day Recycle Bin) |
| `POST /api/v1/links/:id/restore` | `POST` | Authenticated | Restore soft-deleted link |
| `DELETE /api/v1/links/:id/permanent` | `DELETE` | Authenticated | Permanently purge link |
| `GET  /api/v1/qr/:linkId` | `GET` | Public | Stream dynamic QR code (PNG or SVG format) |
| `POST /api/v1/qr/generate` | `POST` | Optional | Generate standalone custom QR code |
| `GET  /api/v1/analytics/overview` | `GET` | Authenticated | Fetch total clicks, active counts, and trends |
| `POST /api/v1/abuse/report` | `POST` | Public | Submit malicious URL report for moderation |
| `DELETE /api/v1/users/account` | `DELETE` | Authenticated | Permanently delete account and all user data |

---

## 🔒 Security Architecture

BreakIfy implements a defense-in-depth posture:
* **Argon2id** password hashing (`memoryCost: 64MB`, `timeCost: 3`, `parallelism: 1`).
* **RFC 6238 TOTP** two-factor authentication with SHA-256 hashed recovery codes.
* **HTTP-Only, SameSite=Lax** cookies for refresh token isolation.
* **SSRF Prevention:** Private subnets (`10.0.0.0/8`, `192.168.0.0/16`, `127.0.0.0/8`) and cloud metadata endpoints (`169.254.169.254`) are strictly blocked.
* **CRLF Injection Defenses:** Destructive header characters are stripped prior to HTTP 302/307 redirects.

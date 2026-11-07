# BreakIfy

> **Shorten. Track. Share.**  
> Enterprise-grade URL shortening, smart routing, dynamic QR codes, analytics intelligence, and link management SaaS platform.

---

## Architecture & System Overview

BreakIfy is engineered as a decoupled, modular TypeScript monorepo adhering strictly to clean architecture principles:

* **Frontend (`/client`):** React 18, Vite, TypeScript, Tailwind CSS (dark-first monochrome zinc palette with light mode toggle), Recharts data visualization, Lucide React icons, and HTML-to-Canvas / jsPDF export engines.
* **Backend (`/server`):** Node.js, Express, TypeScript, Mongoose (MongoDB), Argon2id password hashing, RFC 6238 TOTP engine, Zod payload validation, Helmet security headers, CORS with credentials, and centralized structured error handling.
* **Database & Persistence:** MongoDB with lazy collection initialization, composite indexes, and strict schema validation.
* **Brand Assets (`/assets`):** High-resolution source assets (including official logo `BreakIfy Logo.png`).
* **Containerization:** Production-ready multi-stage Dockerfiles and non-root Docker Compose network topology.

---

## Core Feature Matrix

| Module | Features & Capabilities |
| :--- | :--- |
| **Authentication & Sessions** | Email/Password with Argon2id, Google OAuth 2.0, HTTP-only JWT cookies, active session management, remote device revocation, and suspicious login detection. |
| **Two-Factor Authentication** | RFC 6238 TOTP standard (Google Authenticator, Authy, 1Password) with scannable QR setup, manual base32 secret entry, and 10 single-use hashed recovery backup codes. |
| **Link Management & Routing** | Short URL creation, custom slugs, scheduled activation (`startsAt`), expiration dates (`expiresAt`), click limits, password protection, Geo-IP routing, device-based routing, and A/B split testing. |
| **QR Studio** | Dynamic and static QR code generation, foreground/background customization, read-safe contrast protection, error correction level (L/M/Q/H), bulk link QR batching, and PNG/SVG/PDF downloads. |
| **Analytics & Intelligence** | Real-time backend event collection, privacy-conscious visitor hashing, bot filtering, time-series click trends, device breakdown, browser/OS breakdown, geographic map, referrer breakdown, and CSV export. |
| **Productivity & Recycle Bin** | Activity audit history timeline (search, filter, bulk delete), 30-day soft-delete Recycle Bin with instant restoration, and link health checker (SSRF protected). |
| **Security & Trust** | Multi-tier rate limiting, offline heuristic malicious URL scanner, Google Safe Browsing provider abstraction, public abuse reporting (`/abuse/report`), and CRLF injection defenses. |

---

## Directory Structure

```text
BreakIfy/
├── assets/
│   └── images/
│       └── BreakIfy Logo.png        # Official brand logo
├── client/                          # React + Vite + TypeScript frontend
│   ├── public/                      # Static assets & favicon
│   ├── src/
│   │   ├── __tests__/               # Frontend unit test suite
│   │   ├── components/              # UI design system & shared modals
│   │   ├── context/                 # AuthContext & ThemeContext
│   │   ├── pages/                   # Views (Dashboard, Links, QR, Analytics, History, Bin)
│   │   ├── services/                # API client modules
│   │   └── utils/                   # Formatters & helpers
│   ├── Dockerfile                   # Multi-stage production Nginx container
│   ├── nginx.conf                   # Reverse proxy & SPA routing config
│   └── vite.config.ts
├── server/                          # Express + TypeScript backend
│   ├── src/
│   │   ├── __tests__/               # Vitest suite (Auth, Link, QR, Analytics, Security)
│   │   ├── config/                  # Environment variables & constants
│   │   ├── controllers/             # Request handlers & response formatting
│   │   ├── middlewares/             # Auth, rate-limit, error, and validation
│   │   ├── models/                  # Mongoose schemas (User, Link, ClickEvent, AbuseReport)
│   │   ├── routes/                  # Express API routers
│   │   ├── services/                # Core business logic & threat analyzers
│   │   └── utils/                   # Argon2, TOTP, URL safety, logger
│   └── Dockerfile                   # Multi-stage production Node runner
├── docker-compose.yml               # Container orchestrator (isolated DB network)
├── package.json                     # Monorepo script orchestrator
├── DEPLOYMENT.md                    # Production hosting & DNS playbook
├── SECURITY.md                      # Threat model & cryptographic audit
└── README.md
```

---

## Getting Started

### Prerequisites

* **Node.js:** v18.0.0 or higher (v20+ recommended)
* **npm:** v9.0.0 or higher
* **MongoDB:** Local instance running on port 27017 or MongoDB Atlas connection string.

### 1. Installation

Install dependencies across the monorepo:

```bash
# Backend dependencies
npm install --prefix server

# Frontend dependencies
npm install --prefix client
```

### 2. Environment Configuration

Copy the example environment configurations:

```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

Ensure `server/.env` contains your MongoDB URI and secure JWT secrets:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/breakify
JWT_ACCESS_SECRET=your-32-character-access-secret-minimum
JWT_REFRESH_SECRET=your-32-character-refresh-secret-minimum
```

---

## Running in Development

Run both the backend and frontend concurrently:

```bash
# Terminal 1: Start backend with hot reload (Port 5000)
npm run dev:server

# Terminal 2: Start frontend Vite dev server (Port 5173)
npm run dev:client
```

---

## Docker Deployment

To launch the entire stack (React SPA, Express API, MongoDB) in an isolated container network:

```bash
docker compose up -d --build
```

* **Frontend:** Accessible at `http://localhost:80`
* **API:** Accessible at `http://localhost:80/api/v1`
* **Short Links:** Direct routing via `http://localhost:80/:shortCode`
* **MongoDB:** Kept strictly inside the private Docker network (`breakify-net`) with zero exposed host ports for database security.

---

## Testing & Verification

Run the comprehensive test suite across client and server:

```bash
# Run all 150+ unit and integration tests
npm test

# Run server unit tests individually
npm run test:server

# Run frontend client unit tests
npm run test:client

# Run ESLint across all workspaces
npm run lint

# Compile production builds
npm run build
```

---

## API Documentation Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/:shortCode` | Public link redirection (CRLF & safety checked) | No |
| `POST` | `/api/v1/links` | Create a shortened URL with smart routing | Optional |
| `GET` | `/api/v1/links` | List authenticated user links with pagination | Yes |
| `GET` | `/api/v1/links/recycle-bin` | List soft-deleted links | Yes |
| `POST` | `/api/v1/qr/generate` | Generate customizable QR code (PNG, SVG, PDF) | Optional |
| `GET` | `/api/v1/analytics/overview` | Fetch click trends, geo, device, and referrer metrics | Yes |
| `POST` | `/api/v1/auth/register` | Register account | No (Rate Limited) |
| `POST` | `/api/v1/auth/login` | Sign in (returns 2FA challenge if enabled) | No (Rate Limited) |
| `POST` | `/api/v1/auth/2fa/verify-login` | Verify 6-digit TOTP or backup recovery code | No (Rate Limited) |
| `POST` | `/api/v1/auth/2fa/setup` | Generate TOTP base32 secret and QR code | Yes |
| `GET` | `/api/v1/auth/sessions` | List active sessions and connected devices | Yes |
| `DELETE` | `/api/v1/auth/sessions` | Remote revocation of all other active sessions | Yes |
| `POST` | `/api/v1/abuse/report` | Submit abuse or malicious link report | No (Rate Limited) |

---

## Security Documentation

See [`SECURITY.md`](./SECURITY.md) for detailed threat modeling, cryptographic standards, heuristic scanner boundaries, and abuse response playbooks.

## Production Deployment Playbook

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for DNS setup, SSL certificates, Nginx reverse proxy configuration, and cloud hosting deployment steps.

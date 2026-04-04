# LedgerGuard

**LedgerGuard** — A production-style REST API & Modern React application for a financial ledger. 
It features clear layering (routes through services), robust configuration that fails fast, and architectural choices aimed at safe behavior under role and account changes.

### 🌍 Live Deployments
- **Frontend (Vercel)**: [https://ledger-guard-three.vercel.app/](https://ledger-guard-three.vercel.app/)
- **Backend API (Render)**: [https://ledgerguard.onrender.com/](https://ledgerguard.onrender.com/)

---

This project is structured as a Monorepo containing:
- **Express + Prisma** API under `backend/`
- **Vite + React** UI under `frontend/`

---

## 🚀 Quick Start / Setup

### 1. Database & API (`backend/`)
```bash
git clone <repository-url>
cd backend
copy .env.example .env   # Set your DATABASE_URL + JWT_SECRET here
```

> **Note**: For production, also set `NODE_ENV=production` and `CLIENT_URL` (exact browser origin) to lock down CORS.

```bash
npm install
npx prisma migrate deploy
npm run db:seed          # Populates database with the Demo Roles below
npm start                # Backend starts listening on http://localhost:5000
```

### 2. Web App (`frontend/`)
In a second terminal (API must remain running for data to appear):
```bash
cd frontend
npm install
npm run dev              # Frontend starts on http://localhost:5173
```
> The vite dev server automatically **proxies** `/api` → `http://localhost:5000` to prevent CORS issues locally.

### Production Build (UI)
```bash
cd frontend
npm run build
```
*Note: Set `VITE_API_BASE_URL` when building if the API is hosted remotely on a different domain.*

---

## 🔐 Roles (Seed Data)
The `npm run db:seed` command sets up the following initial accounts:

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| `admin@demo.local` | `ChangeMe!123` | **ADMIN** | Full CRUD over users and records |
| `analyst@demo.local` | `ChangeMe!123` | **ANALYST** | View records and analytics |
| `viewer@demo.local` | `ChangeMe!123` | **VIEWER** | View aggregated dashboard data only |

---

## ✨ Features & Optimizations

- **Auth & Role Authorization**: JWT payloads carry exclusively the `userId`. The backend actively validates the role on every protected request. This ensures that administrative role changes (or account deactivations) take place instantly without waiting for local tokens to expire.
- **Unified Summary Endpoint**: A heavily optimized `/api/dashboard` route concurrently aggregates balance logic and analytics via `Promise.all()`, drastically minimizing network congestion.
- **Imperative Reactive Fetching**: The React frontend guarantees zero-waste data-streaming by terminating redundant React Strict Mode mount-cycles using native `AbortController` cancellation policies.
- **Strict Data Bounding**: The backend mathematically limits paginated directory requests to a strict `max(20)` boundary utilizing Zod validation, preventing memory blowouts.
- **Database Index Optimization**: Deep operations utilize the composite index `@@index([userId, createdAt, type])` providing mathematical maximum throughput for nested ledger analytics.
- **Money Handling Intactness**: Money is stored securely using `Decimal(12,2)` in PostgreSQL to prevent floating-point anomalies, but transmitted safely as raw strings for JSON integrity.
- **Soft Deletions**: Deleting user records flips a boolean `isDeleted` layer instead of wiping rows, guaranteeing audit-compliance history.

---

## 🧪 Testing and Verification

From `backend/` after migrating and seeding:
```bash
npm test                  # Unit tests (validators, middleware, services)
npm run test:integration  # Jest + Supertest: auth flows
npm run check:apis        # Scripts through all active routes locally
npm run smoke             # automated smoke testing script
```

---

## 📡 API Details & Routing

Request flow follows: **`routes` → `controllers` → `services` → Prisma (or `$queryRaw`)**.
Base path: `/api`

| Endpoints | Description |
|-----------|-------------|
| `POST /auth/login` | Log in and receive JWT token |
| `GET /auth/me` | Fetch active user credentials securely |
| `GET/POST /users` | **[ADMIN]** Directory access and creation |
| `GET/POST /records` | **[ADMIN, ANALYST]** Paged ledger list |
| `GET /dashboard` | Returns deeply aggregated account statistics |

To directly inspect the backend flow externally, import our Postman collection located at `postman/LedgerGuard.postman_collection.json`. Run **Auth → Login (admin)** to capture the `token` variable natively, then easily test route boundaries manually!

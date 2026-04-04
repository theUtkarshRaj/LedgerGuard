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

### Architecture (matches `PROCESS.md`)

HTTP handling follows **`routes` → `controllers` → `services` → Prisma** (or `$queryRaw` where needed). Entry: `backend/server.js` (`validateEnv`, then listen); app wiring in `backend/src/app.js` (CORS, JSON, rate limit on `/api`, route mounts, global error handler).

| Layer | Role |
|-------|------|
| **Routes** | Paths, `protect` / `restrictTo(...)`, delegate to controllers |
| **Controllers** | Zod validation, HTTP status codes, call services |
| **Services** | Business rules, Prisma, `AppError` for expected failures |
| **Validators** | Zod schemas for bodies and queries |
| **Middleware** | JWT auth, role checks, rate limit, centralized errors |

**Auth model:** JWT payload carries only **`userId`** (`sub`). On each protected request, the API loads the user from the database and attaches **`req.user`** (including **role** and **isActive**), so role changes and deactivations apply immediately without waiting for token expiry.

For a full route-by-route map, see **[PROCESS.md](./PROCESS.md)**.

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
- **Strict Data Bounding**: List endpoints for **users** and **records** cap `limit` at **20** via Zod; dashboard list-style queries use their own validated caps (e.g. recent items up to **50**).
- **Database Index Optimization**: Deep operations utilize the composite index `@@index([userId, createdAt, type])` providing mathematical maximum throughput for nested ledger analytics.
- **Money Handling Intactness**: Money is stored securely using `Decimal(12,2)` in PostgreSQL to prevent floating-point anomalies, but transmitted safely as raw strings for JSON integrity.
- **Soft delete (ledger rows)**: Removing a **record** sets **`isDeleted`** instead of destroying the row. **Users** are disabled via **`isActive`** (no hard delete in normal flows).

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

All JSON API routes are under **`/api`**. Flow: **`routes` → `controllers` → `services` → Prisma** (or **`$queryRaw`** for trends).

| Method & path | Who | Description |
|---------------|-----|-------------|
| `POST /api/auth/register` | Public | Register; new users get role **VIEWER** |
| `POST /api/auth/login` | Public | JWT + user (no password in response) |
| `GET /api/auth/me` | Authenticated | Current user from DB-backed session |
| `GET`, `POST /api/users` | **ADMIN** | Paginated user directory; create user |
| `GET`, `PATCH /api/users/:id` | **ADMIN** | Get / update user (e.g. **isActive**) |
| `GET /api/records` | **ADMIN**, **ANALYST** | Paginated ledger list (filters: date, category, type, search) |
| `POST /api/records` | **ADMIN** | Create record (optional **userId** for owner; defaults to admin) |
| `PATCH`, `DELETE /api/records/:id` | **ADMIN** | Update or soft-delete a record |
| `GET /api/dashboard` | Authenticated (**VIEWER** allowed) | Combined dashboard data |
| `GET /api/dashboard/overview`, `GET /api/dashboard/summary`, `GET /api/dashboard/categories`, `GET /api/dashboard/recent`, `GET /api/dashboard/trends` | Authenticated (**VIEWER** allowed) | Focused aggregates; **VIEWER** omits some owner-identifying fields (see `dashboard.controller.js`) |

To exercise routes manually, import **`postman/LedgerGuard.postman_collection.json`**. Run **Auth → Login (admin)** to set the `token`, then call protected routes.

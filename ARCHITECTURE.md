# Meridian ERP — Architecture

> Standard framework architecture for the Meridian HRM / ERP platform.
> This document is the blueprint: it explains the layered backend, the
> micro-frontend frontend, the conventions that bind them, and the full
> target scaffold for **every** domain.

---

## 1. System overview

Meridian is a **modular monolith backend** serving a **micro-frontend frontend**,
over a single shared MongoDB. The two halves are split along the **same domain
seams** — People & Culture (HR), Finance, Procurement, Projects — so a feature
lines up on both sides.

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND  —  Micro-Frontends (Vite + Module Federation)          │
│                                                                   │
│   shell (host)  ─loads→  hr · finance · procurement · projects    │
│        │                  (each an independently built remote)    │
│        └── shared packages: @meridian/{ui, api, theme}            │
└───────────────────────────────┬───────────────────────────────────┘
                                 │  HTTPS  /api/*   (JWT bearer)
┌───────────────────────────────┴───────────────────────────────────┐
│  BACKEND  —  Modular Monolith (Express + Mongoose)                 │
│                                                                   │
│   core/   →  asyncHandler · ApiError · errorHandler · validate     │
│              · authGuard · genId                                   │
│   modules/  hr · finance · procurement · projects · shared         │
│        │                                                           │
│        └── each: routes → controller → service → model            │
└───────────────────────────────┬───────────────────────────────────┘
                                 │
                          ┌──────┴──────┐
                          │   MongoDB    │   (one cluster, shared)
                          └─────────────┘
```

**Why a modular monolith, not microservices?** One database, one deploy, and
cross-domain reads (the project P&L joins Expense + CashBook + DayBook + Invoice +
Project). Module boundaries give cohesion and a clean carve-out path *later*,
without distributed-transaction and cross-service-join tax *now*.

**Why micro-frontends?** The legacy frontend transpiled every `.jsx` into one
global browser scope, so files silently collided. MFEs give each domain its own
build, module boundaries, and deploy cadence — that class of bug is gone.

---

## 2. Repository layout

```
ERP_procurement/
├── ARCHITECTURE.md          ← this document
├── CLAUDE.md                ← agent/contributor working notes
│
├── hrm_server.js           Express entry: mounts modules, static, error handler
├── backend/
│   ├── config/db.js        Mongo connection
│   ├── core/               shared cross-cutting infrastructure   ◀ framework
│   ├── modules/            feature modules (the new structure)   ◀ framework
│   │   ├── finance/        ✅ reference implementation
│   │   ├── hr/             ⬜ to migrate
│   │   ├── procurement/    ⬜ to migrate
│   │   ├── projects/       ⬜ to migrate
│   │   └── shared/         ⬜ auth, dashboard, activity, notes
│   ├── models/             Mongoose schemas (shared by modules)
│   ├── routes/             ⬜ legacy flat routes (being migrated into modules/)
│   └── seed/index.js       wipes + repopulates demo data (npm run seed)
│
├── mfe/                     micro-frontend monorepo (pnpm workspace)
│   ├── apps/
│   │   ├── shell/          host: auth, sidebar, theming, loads remotes
│   │   ├── hr/             remote (:5102)
│   │   ├── finance/        remote (:5103)
│   │   ├── procurement/    remote (:5101)
│   │   └── projects/       remote (:5104)
│   └── packages/
│       ├── ui/             shared primitives (Icon, Button, KPI…)
│       ├── api/            auth-aware fetch client
│       └── theme/          design tokens + applyTheme()
│
└── *.jsx, index.html       legacy monolith frontend (browser-transpiled)
                            — superseded by mfe/, kept until cutover
```

> **Two frontends, one backend.** The legacy root `.jsx` monolith and the new
> `mfe/` remotes both talk to the same `/api`. Migrate UI domain-by-domain; the
> backend doesn't care which client calls it.

---

## 3. Backend — modular monolith

### 3.1 Request flow

```
HTTP request
   │
   ▼
Router            modules/<domain>/<entity>.routes.js   — URL → handler, attach middleware
   │
   ├─ authGuard       (optional) verify JWT → req.user
   ├─ validate(schema)         reject bad input with 400 before the DB
   │
   ▼
Controller        <entity>.controller.js                — read req, call service, shape res
   │              (wrapped in asyncHandler — no try/catch)
   ▼
Service           <entity>.service.js                   — business logic, ID gen, orchestration
   │                                                       PURE of req/res → unit-testable
   ▼
Model             models/<Name>.js                      — Mongoose schema, enums, constraints
   │
   ▼
MongoDB
   │
   ▼  (on any throw)
errorHandler      core/errorHandler.js                  — one consistent { error, code } shape
```

### 3.2 The `core/` framework

Cross-cutting concerns live once, in `backend/core/`:

| Export | File | Purpose |
|--------|------|---------|
| `asyncHandler(fn)` | `core/index.js` | Wraps async handlers so throws/rejections reach the error handler — **removes the per-route try/catch**. |
| `ApiError` | `core/index.js` | Operational error with an HTTP status. `ApiError.notFound()`, `.badRequest()`, `.unauthorized()`. Throw from services for expected failures. |
| `genId(prefix)` | `core/index.js` | Business IDs: `genId("CB") → "CB-LXY12Z"`. |
| `errorHandler` | `core/errorHandler.js` | **The single** error→HTTP translator. Maps Mongoose `ValidationError`/`CastError`, dup-key `11000`, Multer errors; hides 500 internals. Register **last**. |
| `notFound` | `core/errorHandler.js` | JSON 404 for unmatched `/api/*` (before the static fallback). |
| `validate(schema)` | `core/validate.js` | Dependency-free request validation (required / type / enum). Deeper rules stay in the model. |
| `authGuard` | `core/authGuard.js` | Reusable JWT middleware → sets `req.user`. Apply per route or per module. |

> **Auth status:** historically only `auth.js` verified tokens; all resource
> routes were open. `authGuard` is the reusable fix. It is **built but not yet
> enforced on finance** because the ported finance pages call `window.API`
> without a bearer token — enabling it before those pages move to the auth-aware
> `@meridian/api` client would 401 the app.

### 3.3 Module anatomy (one entity)

```
modules/finance/
├── index.js                    combines sub-routers → one /api router
├── parties.routes.js           wiring + validation schema (+ optional authGuard)
├── parties.controller.js       HTTP glue only — asyncHandler-wrapped
├── parties.service.js          business + data access (no req/res)
└── …                           same trio per entity (cashbook, daybook, expenses)
```

**Layer rules**
- **routes** — URL → handler, attach `validate`/`authGuard`. No logic.
- **controller** — read `req`, call service, shape `res`. No try/catch, no business rules, no Mongoose.
- **service** — all business rules, ID generation, cross-model orchestration, data access. Knows nothing about `req`/`res` → unit-testable in isolation.
- **model** — schema, enums, unique constraints, hooks.

`index.js` is mounted by the host with its public prefix preserved:

```js
// hrm_server.js
app.use("/api", require("./backend/modules/finance"));  // → /api/parties, /api/cashbook, …
```

### 3.4 Full target scaffold (all domains)

Finance is done; the rest follow the identical shape. Map of legacy route → module:

```
backend/modules/
│
├── shared/                     cross-domain / platform
│   ├── auth.{routes,controller,service}.js        ← routes/auth.js
│   ├── dashboard.{routes,controller,service}.js   ← routes/dashboard.js
│   ├── activity.{routes,controller,service}.js    ← routes/activity.js
│   └── notes.{routes,controller,service}.js       ← routes/notes.js
│
├── hr/                         People & Culture
│   ├── employees.*       departments.*       leaveRequests.*    leaveTypes.*
│   ├── openings.*        candidates.*         payroll.*          salaryStructures.*
│   ├── renewals.*        attendance.*         headcount.*        calendarEvents.*
│   ├── onboarding.*      benefits.*           shifts.*           courses.*
│   ├── documents.*       reviewCycles.*       appraisals.*       orgGoals.*
│   └── index.js          → /api/employees, /api/leave-requests, …
│
├── finance/                    ✅ DONE — reference
│   ├── parties.*  cashbook.*  daybook.*  expenses.*
│   └── index.js          → /api/parties, /api/cashbook, /api/daybook, /api/expenses
│
├── procurement/
│   ├── procurement.{routes,controller,service}.js
│   └── index.js          → /api/procurement
│
└── projects/
    ├── projects.*  quotations.*  invoices.*  projectReports.*
    └── index.js          → /api/projects, /api/quotations, /api/invoices, /api/reports
```

> `projectReports` is the cross-domain read — its service reads Expense, CashBook,
> DayBook, Invoice and Project models to build per-project P&L. In a modular
> monolith this is a plain in-process call; that's exactly why we don't split
> these into separate services.

### 3.5 Conventions

| Concern | Convention |
|---------|-----------|
| **Identity** | Keyed on human-readable business IDs (`empId`, `entryId`, `partyId`, `projectId`), **not** Mongo `_id`. `findOne({ empId })`, `findOneAndUpdate({ empId }, …)`. |
| **ID generation** | `genId("PREFIX")` in the service (or a model `pre('save')` hook). Some legacy entities (e.g. Expense) accept a client-supplied id — preserve documented exceptions. |
| **Error shape** | Always `{ error: string, code: string }` with the right status. Never hand-roll in handlers — throw `ApiError` or let Mongoose throw; the central handler formats it. |
| **Validation** | `validate(schema)` at the route for shape; Mongoose enums/required for depth. |
| **Async** | Every handler wrapped in `asyncHandler`. No `try/catch` in controllers. |
| **HTTP status** | 200 read/update, 201 create, 400 validation, 401 auth, 404 missing, 409 duplicate, 500 unexpected. |

---

## 4. Frontend — micro-frontends

### 4.1 Host + remotes

```
apps/shell  (host, :5100)
  ├─ owns: login, JWT storage, sidebar, theming, top-level routing
  ├─ React.lazy(() => import("finance/App"))   ← federated remote
  └─ RemoteBoundary: a remote crashing/offline shows a localized error,
                     never takes down the shell

apps/<remote>  (procurement :5101 · hr :5102 · finance :5103 · projects :5104)
  ├─ exposes ./App via remoteEntry.js (Module Federation)
  ├─ runs standalone too (own index.html) for isolated dev
  └─ src/
      ├─ App.jsx           remote root: subnav + routes its own pages
      ├─ bootstrap.jsx     mounts <App/> (async boundary for federation)
      ├─ main.js           import("./bootstrap.jsx")
      ├─ legacy.jsx        ported shared primitives (Icon, Button, …)
      ├─ setup.js          shims window.API for wholesale-ported pages
      └─ pages/            one screen per file
```

`react` / `react-dom` are **shared singletons** across host and remotes — one
React instance for the whole app.

### 4.2 Shared packages

| Package | Provides |
|---------|----------|
| `@meridian/ui` | Primitives: `Icon`, `Button`, `Card`, `KPI`, `Spinner`, `ErrorState`… |
| `@meridian/api` | Auth-aware fetch client. Attaches `Authorization: Bearer <token>` automatically; `api.get/post/patch/del/upload`. Base via `VITE_API_BASE`. |
| `@meridian/theme` | Design tokens + `applyTheme(accent)` (CSS variables). |

### 4.3 Frontend conventions

- **Per-domain layout** mirrors the backend module: screens in `src/pages/`,
  shared bits in `src/legacy.jsx` / `setup.js`.
- **Newly written** code imports from `@meridian/ui` / `@meridian/api`; **ported**
  pages may read globals (`window.API`) via `setup.js` until rewritten.
- Domain constants stay **module-scoped** (no global-scope collisions).
- Cross-remote navigation goes through the **shell**, not direct remote-to-remote
  imports (remotes are deployed independently and can't import each other's `src/`).

---

## 5. The API contract (the seam)

Both frontends speak the same REST surface. Stability of this contract is what
lets backend and frontend migrate independently.

```
/api/auth            login, me, my-profile, users         (shared)
/api/dashboard       aggregate boot data                  (shared)
/api/employees …     20 HR resources                      (hr)
/api/parties|cashbook|daybook|expenses                    (finance)
/api/procurement                                          (procurement)
/api/projects|quotations|invoices|reports                 (projects)
```

- **Auth:** JWT bearer. Shell logs in, stores token, `@meridian/api` attaches it.
- **Errors:** uniform `{ error, code }` + HTTP status (see §3.5).
- **Files:** multipart upload (`multer`) for attachments; served from `/uploads`.

---

## 6. Migration status & roadmap

| Layer | Item | Status |
|-------|------|--------|
| Backend | `core/` framework | ✅ done |
| Backend | `finance` module (reference) | ✅ done |
| Backend | `hr` / `procurement` / `projects` / `shared` modules | ⬜ to migrate |
| Backend | enforce `authGuard` per route | ⬜ after frontend tokens land |
| Frontend | MFE shell + remotes scaffolded | ✅ done |
| Frontend | finance, hr, procurement, projects ported | ✅ pages migrated |
| Frontend | retire legacy root `.jsx` monolith | ⬜ after cutover |

**Recommended order:** `procurement` (smallest, single resource) → `projects`
→ `hr` (largest) → `shared` (auth/dashboard last, highest blast radius).

---

## 7. Adding a feature — end to end

**Backend (new resource in an existing module):**
1. Add `models/Thing.js` (schema + enums + unique business id).
2. In `modules/<domain>/`: add `thing.service.js` (logic + data), `thing.controller.js` (asyncHandler glue), `thing.routes.js` (wiring + `validate` schema).
3. Register it in that module's `index.js` (`router.use("/things", require("./thing.routes"))`).

**Frontend (new screen in the matching remote):**
1. Add `apps/<remote>/src/pages/ThingPage.jsx`, importing from `@meridian/ui` / `@meridian/api`.
2. Wire it into that remote's `App.jsx` (subnav entry + route).

No `hrm_server.js` change needed if the domain module is already mounted.

---

## 8. Commands

```bash
# Backend (repo root)
npm run dev          # nodemon hrm_server.js  (:5000)
npm start            # node hrm_server.js
npm run seed         # WIPES + repopulates MongoDB (demo data)

# Frontend (mfe/)
pnpm install
pnpm dev             # shell :5100 + remotes :5101–5104
pnpm build           # build every app; each remote emits assets/remoteEntry.js
```

Requires `.env` with `MONGODB_URI` (and optional `JWT_SECRET`, `PORT`). The
backend serves the legacy frontend statically and the MFE shell proxies `/api`
to it, so one running backend powers both.

---

*Reference implementation to copy: `backend/modules/finance/` and `backend/core/`.
Reference frontend remote: `mfe/apps/procurement/`.*

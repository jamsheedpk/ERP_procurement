# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Despite the `ERP_procurement` directory name, this is **Meridian HRM** (`package.json` → `hrm-meridian`): an HR / finance / projects admin app for a fictional logistics company, Meridian Logistics DMCC. It spans People & Culture (employees, leave, payroll, attendance, recruitment, onboarding, performance, training), Finance (cash book, day book, expenses, parties), and Projects (pipeline, quotations, P&L reports).

## Commands

```bash
npm run dev     # nodemon hrm_server.js — dev server with reload (port 5000)
npm start       # node hrm_server.js — production-style run
npm run seed    # WIPES and repopulates MongoDB from backend/seed/index.js
```

There is **no build step, no linter, and no test suite**. The frontend is transpiled in the browser (see below), so editing a `.jsx` file and reloading is the full dev loop. The `check_salary*.mjs` files in the root are ad-hoc one-off debug scripts, not part of the app.

Requires a `.env` with `MONGODB_URI`, and optionally `JWT_SECRET` and `PORT` (defaults: 5000, dev secret). MongoDB must be reachable or the server exits on boot (`backend/config/db.js`).

Seeded logins: `admin@meridian.ae` / `admin123` (admin), and `<name>@meridian.ae` / `emp123` (employee accounts, each linked to an `empId`).

## Architecture

### Frontend — no bundler, runs in the browser
`index.html` is the entire app shell. It loads React 18 (UMD), Babel Standalone, and Lucide from CDNs, then includes every `*.jsx` file as `<script type="text/babel">`. Babel transpiles JSX **in the browser at load time**. Consequences to keep in mind:

- **All top-level `function`/`const` in `.jsx` files share one global scope.** A component in `PeoplePage.jsx` can call one defined in `Primitives.jsx` with no import. There are no ES module imports/exports in the frontend.
- **Script order in `index.html` matters.** `Primitives.jsx` loads first and defines shared UI (`Icon`, `Avatar`, etc.) plus `window.API`. New page files must be added to the `<script>` list in `index.html` to load at all.
- The root `App()` component lives inline in `index.html`. It holds `route` state, maps routes → breadcrumbs via `ROUTE_CRUMBS`, handles JWT auth, and does the initial `Promise.all` fan-out fetch of all dashboard data.
- Each `XxxPage.jsx` is one route screen. `Chrome.jsx` is the sidebar/topbar frame; `tweaks-panel.jsx` is a live theming panel (accent/density/canvas, persisted via `useTweaks`).
- Theming is CSS variables set by `applyTheme()` against curated palettes in `index.html`; `hrm.css` + `colors_and_type.css` hold the styles.
- Several "today" dates are **hardcoded** (e.g. `TODAY = new Date(2026,4,21)` and fixed `?date=2026-05-21` / `?month=2026-05` query params in the App fetch). When data looks empty, check whether a date filter is pinned to May 2026.
- `data.js` is legacy seed/mock data; live data comes from the API.

### Backend — Express + Mongoose
`hrm_server.js` connects to MongoDB, then mounts ~30 route modules under `/api/*`, serves `/uploads` statically (multer-uploaded files; see `routes/documents.js`, `routes/expenses.js`), and serves the repo root as static files with no-cache headers so frontend edits show immediately.

The backend is a flat, highly repetitive CRUD layer: **one `backend/models/X.js` ↔ one `backend/routes/x.js` ↔ one `/api/x` mount.** To add a feature you typically add a model, a route file following the existing pattern, and register it in both `hrm_server.js` and (for the UI) `index.html`.

Key conventions:
- **Routes are keyed on human-readable business IDs, not Mongo `_id`.** Employees use `empId` (`"EMP-2451"`), departments `deptId`, leave `leaveId`, etc. `findOne({ empId })` / `findOneAndUpdate({ empId }, …)` is the norm. The frontend `App()` re-aliases these onto an `id` field after fetching (`{ ...e, id: e.empId }`) so pages can use a generic `id`.
- Route handlers wrap everything in try/catch and return `{ error: err.message }` with 400 (validation/create) or 500 (read/server) status codes. Match this shape.
- **Auth is JWT but only manually verified inside `routes/auth.js`** (`/login`, `/me`, `/my-profile`, `/users`). The other `/api/*` routes are currently unauthenticated — there is no shared auth middleware applied in `hrm_server.js`. Don't assume `req.user` exists in resource routes.
- Passwords are bcrypt-hashed on the `User` model (`matchPassword`). `User` is the login account; `Employee` is the HR record; they are linked by `empId`.

### Seeding
`npm run seed` (`backend/seed/index.js`) deletes and recreates all collections from hardcoded arrays — it is the source of truth for demo data and for the relationships between users, employees, departments, and IDs. `backend/seed/provision-employees.js` is a related provisioning helper.

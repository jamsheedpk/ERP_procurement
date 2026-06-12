# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Despite the `ERP_procurement` directory name, this is **Meridian ERP** (`package.json` → `hrm-meridian`): an HR / finance / projects / procurement admin app for a fictional logistics company, Meridian Logistics DMCC. It is a **modular-monolith Express API** plus a **micro-frontend UI** (Vite + Module Federation). The old browser-transpiled monolith frontend has been removed — the MFE under `mfe/` is the only frontend. See `ARCHITECTURE.md` for the full blueprint.

## Commands

```bash
# Backend API (port 5000; MongoDB must be reachable or it exits on boot)
npm run dev          # nodemon hrm_server.js
npm start            # node hrm_server.js
npm run seed         # WIPES and repopulates MongoDB from backend/seed/index.js

# Frontend — all 6 apps with one command (from mfe/; uses npm, pnpm not required)
cd mfe
npm run dev          # shell hot-reload + 5 remotes built & served
npm run preview      # serve all 6 from existing builds (fastest)
npm run build        # build all 6

# Single remote standalone (hot reload, e.g. hr)
cd mfe/apps/hr && npm run dev
```

Open **http://localhost:5100** (the shell). Ports: shell 5100, procurement 5101, hr 5102, finance 5103, projects 5104, core 5105, API 5000.

There is **no test suite or linter**. UI changes are verified by running the stack and driving it (Playwright works well). Requires `.env` with `MONGODB_URI` (optional `JWT_SECRET`, `PORT`). The `check_salary*.mjs` files are ad-hoc debug scripts.

Seeded logins: `admin@meridian.ae` / `admin123` (admin), `<name>@meridian.ae` / `emp123` (employees, e.g. `aarav.s@meridian.ae`, each linked to an `empId`).

## Architecture

### Frontend — micro-frontends (`mfe/`)
- **Shell** (`mfe/apps/shell`) is the host: login, role-aware sidebar/topbar, theme picker, and a `RemoteBoundary` per federated remote. Remotes are loaded from `http://localhost:510x/assets/remoteEntry.js` (see `shell/vite.config.js`).
- **Remotes**: `core` (exec Dashboard, Reports, Permissions), `hr` (13 admin pages + EmployeePortal), `finance`, `projects`, `procurement`. Each exposes `./App`, runs standalone on its own port for isolated dev, and carries `src/legacy.jsx` (ESM port of the old shared primitives) + `src/legacy/*.css` (monolith styling).
- **Shared workspace packages** (`mfe/packages/`): `@meridian/api` (API client, token storage, `installAuthFetch()` global fetch shim that attaches the JWT to `window.API` calls), `@meridian/theme` (CSS-variable palettes, `applyTheme`/`getSavedAccent`/`setAccent`), `@meridian/ui` (Icon, Button, Spinner, ErrorState…).
- Pages ported from the monolith read `window.API` directly; each remote's `src/setup.js` sets it and installs the auth fetch shim.
- **Roles**: `userRole: "admin"` gets the full ERP; `"employee"` gets only the EmployeePortal, rendered full-screen (no host chrome). Enforced in the shell, the hr remote, **and** the API.
- pnpm is not installed on this machine; the `mfe/` scripts use `npm --prefix`. Per-app `node_modules` are pnpm-style relative symlinks at equal depth — for a new remote, `cp -RP` an existing app's `node_modules`.
- Hardcoded demo dates: data lives in **May 2026** (e.g. `?date=2026-05-21` in `hr/src/data.js`). When data looks empty, check the pinned date first.

### Backend — Express + Mongoose (`hrm_server.js`, `backend/`)
- Mostly flat CRUD: **one `backend/models/X.js` ↔ one `backend/routes/x.js` ↔ one `/api/x` mount**. Finance is the modular exception (`backend/modules/finance`, route→controller→service). The server serves `/uploads` statically; `/` returns a JSON pointer (no frontend).
- **Server-side RBAC** (`backend/middleware/auth.js`): every `/api/*` mount is tiered in `hrm_server.js` — `authRequired` (any signed-in user; the portal surface: leave-requests, leave-types, payroll, projects) or `adminOnly` (everything else). `req.user` = `{ id, name, email, role, userRole, empId }`, looked up fresh per request. `/api/auth` guards itself (`/users*` are adminOnly).
- **Routes are keyed on human-readable business IDs, not Mongo `_id`**: `empId` ("EMP-2451"), `deptId`, `leaveId`, etc. `findOne({ empId })` is the norm; the frontend re-aliases onto `id`.
- Handlers wrap in try/catch and return `{ error: err.message }` with 400 (create/validation) or 500 (read). Match this shape.
- `User` (bcrypt login account, `userRole` admin|employee) links to `Employee` (HR record) via `empId`.

### Seeding
`npm run seed` (`backend/seed/index.js`) deletes and recreates all collections — the source of truth for demo data and ID relationships. `backend/seed/provision-employees.js` is a provisioning helper.

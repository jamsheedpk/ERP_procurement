# Meridian ERP — Micro-Frontend Architecture

A Vite + **Module Federation** micro-frontend split of Meridian ERP, living alongside
the existing monolith. The Express backend (`../hrm_server.js`) stays as the single
shared API — this is a **frontend-only** decomposition.

## Why
The monolith transpiles every `.jsx` in the browser into **one global scope**, so
files silently collide (e.g. two global `stageIndex` functions pinned the procurement
stepper to "Stage 1"). MFEs give each domain its own build, module boundaries, and
deploy cadence — that whole class of bug becomes structurally impossible.

## Layout
```
mfe/
  apps/
    shell/        Host — auth, sidebar, theming, routes → loads remotes at runtime (:5100)
    procurement/  Remote — fully migrated reference module (:5101)
    hr/           Remote stub — People & Culture (:5102)
    finance/      Remote stub — Finance (:5103)
    projects/     Remote stub — Projects (:5104)
  packages/
    api/          Shared API client (auth-aware fetch, VITE_API_BASE)
    ui/           Shared primitives (Icon, Button, Card, KPI, Spinner…)
    theme/         Design tokens + applyTheme()
```

- **Host** (`shell`) declares the remotes and lazy-loads `remote/App` via React.lazy.
- **Remotes** expose `./App` through `remoteEntry.js`; `react`/`react-dom` are shared
  singletons so there's one React instance across the app.
- Each remote also runs **standalone** (its own `index.html`) for isolated dev.

## Prerequisites
The shared backend must be running: from the repo root, `npm run dev` (port 5000).
Override the API origin per app with `VITE_API_BASE` if needed.

## Install
```bash
cd mfe
pnpm install
```

## Run (dev)
Remotes are served as built bundles (Module Federation needs `remoteEntry.js`), the
host runs Vite dev:
```bash
pnpm dev          # shell on :5100 + all remotes built & previewed on :5101–5104
```
Open http://localhost:5100 and sign in (`admin@meridian.ae` / `admin123`).

Run one remote in isolation instead:
```bash
pnpm --filter procurement dev   # standalone at :5101
```

## Build (prod)
```bash
pnpm build        # builds every app; each remote emits assets/remoteEntry.js
```
Deploy each `apps/*/dist` to its own origin and update the remote URLs in
`apps/shell/vite.config.js`.

## Migrating the rest of the monolith
The `procurement` remote is the reference. For each remaining page:
1. Drop the component into the matching remote under `src/`.
2. Replace global references (`Icon`, `Button`, `AED`, `window.API`, …) with imports
   from `@meridian/ui` / `@meridian/api`.
3. Keep domain constants **module-scoped** (see `procurement/src/stages.js`).
4. Wire it into that remote's `App.jsx`.

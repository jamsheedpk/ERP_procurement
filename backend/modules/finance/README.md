# Finance module — reference for the layered backend architecture

This is the **reference implementation** for migrating the flat `routes/` + `models/`
backend into a feature-modular, layered structure (mirrors the frontend MFE remotes).

## Layers

```
Request → routes → (validate) → controller → service → model → MongoDB
                                  (HTTP glue)  (business    (Mongoose
                                               + data)       schema)
```

| File | Layer | Holds |
|------|-------|-------|
| `*.routes.js`      | wiring     | URL → handler, validation schema, (optional) `authGuard` |
| `*.controller.js`  | HTTP       | read `req`, call service, shape `res`. No try/catch. |
| `*.service.js`     | business   | filters, ID generation, orchestration, data access |
| `../../models/*`   | data       | Mongoose schema, enums, unique constraints |
| `index.js`         | module     | combines the sub-routers into one `/api` router |

Cross-cutting concerns live in **`backend/core/`**:
- `asyncHandler` — removes the per-handler try/catch
- `ApiError` + `errorHandler` — one consistent `{ error, code }` error shape
- `validate` — dependency-free request validation
- `authGuard` — reusable JWT middleware (built, not yet enforced — see its note)
- `genId` — `genId("CB")` → `CB-LXY12Z`

## Public surface (unchanged)
`/api/parties` · `/api/cashbook` · `/api/daybook` · `/api/expenses` — identical
paths, payloads and responses to the old routes, so both frontends keep working.

## Migrating the other domains
Copy this shape per domain: create `backend/modules/<domain>/`, split each old
`routes/x.js` into `x.{routes,controller,service}.js`, move business logic into the
service, and register the module router in `hrm_server.js`. Suggested next:
`hr/`, `procurement/`, `projects/`, then `shared/` (auth, dashboard).

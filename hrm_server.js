require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const morgan    = require("morgan");
const path      = require("path");
const connectDB = require("./backend/config/db");
const { errorHandler, notFound } = require("./backend/core/errorHandler");
const { authRequired, adminOnly } = require("./backend/middleware/auth");

connectDB();

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

/* ── API routes ──────────────────────────────────────────────────────────────
 * Access tiers:
 *   • /api/auth         — public login + self-service (guards itself internally)
 *   • authRequired      — any signed-in user; the employee self-service portal needs these
 *   • adminOnly         — admin accounts only (the rest of the ERP)
 * ──────────────────────────────────────────────────────────────────────────── */
app.use("/api/auth",            require("./backend/routes/auth"));

// Employee self-service portal surface — readable by any authenticated user.
app.use("/api/leave-requests",  authRequired, require("./backend/routes/leaveRequests"));
app.use("/api/leave-types",     authRequired, require("./backend/routes/leaveTypes"));
app.use("/api/payroll",         authRequired, require("./backend/routes/payroll"));
app.use("/api/projects",        authRequired, require("./backend/routes/projects"));

// Admin-only — the rest of the ERP.
app.use("/api/dashboard",       adminOnly, require("./backend/routes/dashboard"));
app.use("/api/employees",       adminOnly, require("./backend/routes/employees"));
app.use("/api/departments",     adminOnly, require("./backend/routes/departments"));
app.use("/api/openings",        adminOnly, require("./backend/routes/openings"));
app.use("/api/candidates",      adminOnly, require("./backend/routes/candidates"));
app.use("/api/renewals",        adminOnly, require("./backend/routes/renewals"));
app.use("/api/activity",        adminOnly, require("./backend/routes/activity"));
app.use("/api/attendance",      adminOnly, require("./backend/routes/attendance"));
app.use("/api/headcount",       adminOnly, require("./backend/routes/headcount"));
app.use("/api/calendar-events", adminOnly, require("./backend/routes/calendarEvents"));
app.use("/api/onboarding",      adminOnly, require("./backend/routes/onboarding"));
app.use("/api/benefits",        adminOnly, require("./backend/routes/benefits"));
app.use("/api/shifts",          adminOnly, require("./backend/routes/shifts"));
app.use("/api/courses",         adminOnly, require("./backend/routes/courses"));
app.use("/api/documents",       adminOnly, require("./backend/routes/documents"));
// Finance domain — modular architecture (route→controller→service). Exposes the
// same paths: /api/parties, /api/cashbook, /api/daybook, /api/expenses.
app.use("/api",                 adminOnly, require("./backend/modules/finance"));
app.use("/api/procurement",     adminOnly, require("./backend/routes/procurement"));
app.use("/api/quotations",      adminOnly, require("./backend/routes/quotations"));
app.use("/api/invoices",        adminOnly, require("./backend/routes/invoices"));
app.use("/api/reports",         adminOnly, require("./backend/routes/projectReports"));
app.use("/api/review-cycles",   adminOnly, require("./backend/routes/reviewCycles"));
app.use("/api/appraisals",      adminOnly, require("./backend/routes/appraisals"));
app.use("/api/org-goals",       adminOnly, require("./backend/routes/orgGoals"));
app.use("/api/notes",           adminOnly, require("./backend/routes/notes"));
app.use("/api/salary-structures", adminOnly, require("./backend/routes/salaryStructures"));

/* ── Unmatched API routes → JSON 404 (before the static fallback) ── */
app.use("/api", notFound);

/* ── Uploaded files ─────────────────────────────────── */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ── Static assets & frontend files (no-cache in dev) ── */
app.use(express.static(__dirname, {
  etag: false,
  lastModified: false,
  setHeaders(res) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
  },
}));

/* ── Central error handler (must be last) ─────────────── */
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n  HRM  →  http://localhost:${PORT}`);
  console.log(`  API  →  http://localhost:${PORT}/api\n`);
});

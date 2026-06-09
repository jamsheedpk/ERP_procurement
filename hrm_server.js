require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const morgan    = require("morgan");
const path      = require("path");
const connectDB = require("./backend/config/db");

connectDB();

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

/* ── API routes ──────────────────────────────────────── */
app.use("/api/auth",            require("./backend/routes/auth"));
app.use("/api/dashboard",       require("./backend/routes/dashboard"));
app.use("/api/employees",       require("./backend/routes/employees"));
app.use("/api/departments",     require("./backend/routes/departments"));
app.use("/api/leave-requests",  require("./backend/routes/leaveRequests"));
app.use("/api/leave-types",     require("./backend/routes/leaveTypes"));
app.use("/api/openings",        require("./backend/routes/openings"));
app.use("/api/candidates",      require("./backend/routes/candidates"));
app.use("/api/payroll",         require("./backend/routes/payroll"));
app.use("/api/renewals",        require("./backend/routes/renewals"));
app.use("/api/activity",        require("./backend/routes/activity"));
app.use("/api/attendance",      require("./backend/routes/attendance"));
app.use("/api/headcount",       require("./backend/routes/headcount"));
app.use("/api/calendar-events", require("./backend/routes/calendarEvents"));
app.use("/api/onboarding",     require("./backend/routes/onboarding"));
app.use("/api/benefits",       require("./backend/routes/benefits"));
app.use("/api/shifts",         require("./backend/routes/shifts"));
app.use("/api/courses",        require("./backend/routes/courses"));
app.use("/api/documents",      require("./backend/routes/documents"));
app.use("/api/expenses",       require("./backend/routes/expenses"));
app.use("/api/cashbook",       require("./backend/routes/cashbook"));
app.use("/api/daybook",        require("./backend/routes/daybook"));
app.use("/api/parties",        require("./backend/routes/parties"));
app.use("/api/projects",       require("./backend/routes/projects"));
app.use("/api/quotations",     require("./backend/routes/quotations"));
app.use("/api/reports",        require("./backend/routes/projectReports"));
app.use("/api/review-cycles", require("./backend/routes/reviewCycles"));
app.use("/api/appraisals",    require("./backend/routes/appraisals"));
app.use("/api/org-goals",     require("./backend/routes/orgGoals"));
app.use("/api/notes",              require("./backend/routes/notes"));
app.use("/api/salary-structures",  require("./backend/routes/salaryStructures"));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n  HRM  →  http://localhost:${PORT}`);
  console.log(`  API  →  http://localhost:${PORT}/api\n`);
});

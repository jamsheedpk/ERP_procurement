const express           = require("express");
const router            = express.Router();
const Employee          = require("../models/Employee");
const Department        = require("../models/Department");
const LeaveRequest      = require("../models/LeaveRequest");
const Opening           = require("../models/Opening");
const Renewal           = require("../models/Renewal");
const PayrollRun        = require("../models/PayrollRun");
const Activity          = require("../models/Activity");
const HeadcountSnapshot = require("../models/HeadcountSnapshot");
const AttendanceDay     = require("../models/AttendanceDay");
const CalendarEvent     = require("../models/CalendarEvent");

router.get("/", async (req, res) => {
  try {
    const now          = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [
      employees, departments, pendingLeaves, allRenewals, openings,
      payrollRun, activity, headcountSnapshots, attendanceDay, calendarEvts,
    ] = await Promise.all([
      Employee.find({ status: { $ne: "inactive" } }).select("empId name status dept deptId grade av").lean(),
      Department.find().sort({ name: 1 }).lean(),
      LeaveRequest.find({ status: "pending" }).sort({ submitted: -1 }).lean(),
      Renewal.find().sort({ days: 1 }).lean(),
      Opening.find({ status: { $ne: "closed" } }).sort({ posted: -1 }).lean(),
      PayrollRun.findOne().sort({ createdAt: -1 }).lean(),
      Activity.find().sort({ createdAt: -1 }).limit(7).lean(),
      HeadcountSnapshot.find().sort({ order: 1 }).lean(),
      AttendanceDay.findOne().sort({ date: -1 }).lean(),
      CalendarEvent.find({ month: currentMonth }),
    ]);

    const headcount   = employees.length;
    const activeToday = employees.filter(e => e.status === "active").length;
    const onLeave     = employees.filter(e => e.status === "on-leave").length;

    // Group calendar events by day number for easy lookup
    const monthEvents = {};
    calendarEvts.forEach(e => {
      const d = String(e.day);
      if (!monthEvents[d]) monthEvents[d] = [];
      monthEvents[d].push({ kind: e.kind, label: e.label });
    });

    res.json({
      company:        { headcount, activeToday, onLeave },
      departments,
      pendingLeaves,
      renewals:       allRenewals,
      openings,
      payrollRun,
      activity,
      headcountTrend: headcountSnapshots,
      attendanceToday: attendanceDay?.donut || [],
      weekAttendance:  attendanceDay?.week  || [],
      monthEvents,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

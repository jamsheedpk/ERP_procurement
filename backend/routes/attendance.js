const express          = require("express");
const router           = express.Router();
const AttendanceDay    = require("../models/AttendanceDay");
const AttendanceRecord = require("../models/AttendanceRecord");
const Employee         = require("../models/Employee");

// ── Aggregated (legacy donut/week) ────────────────────────────────────────────

// GET /api/attendance/today?date=YYYY-MM-DD  — donut segments
router.get("/today", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    // Try to compute from real records first
    const records = await AttendanceRecord.find({ date });
    if (records.length > 0) {
      const counts = { present: 0, late: 0, wfh: 0, leave: 0, absent: 0 };
      records.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
      const COLOR = { present: "#1F8A52", late: "#D78A14", wfh: "#2563B0", leave: "#B61B54", absent: "#C0263A" };
      const LABEL = { present: "Present", late: "Late", wfh: "WFH", leave: "On leave", absent: "No-show" };
      const donut = Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => ({ lbl: LABEL[k], v, c: COLOR[k] }));
      return res.json(donut);
    }
    // Fall back to pre-seeded AttendanceDay
    const doc = await AttendanceDay.findOne({ date });
    if (!doc) return res.status(404).json({ error: "No record for date " + date });
    res.json(doc.donut);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/attendance/week?date=YYYY-MM-DD  — Mon-Sun bar data
router.get("/week", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    // Compute Mon of the week containing `date`
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      weekDates.push(dt.toISOString().slice(0, 10));
    }

    const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const COLOR = { present: "#1F8A52", late: "#D78A14", wfh: "#2563B0", leave: "#B61B54", absent: "#C0263A" };

    const bars = await Promise.all(weekDates.map(async (dt, i) => {
      const records = await AttendanceRecord.find({ date: dt });
      if (records.length > 0) {
        const counts = { present: 0, late: 0, wfh: 0, leave: 0, absent: 0 };
        records.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
        const segments = [
          { key: "Present", value: counts.present + counts.late, color: COLOR.present },
          { key: "WFH",     value: counts.wfh,                   color: COLOR.wfh },
          { key: "Leave",   value: counts.leave,                  color: COLOR.leave },
          { key: "No-show", value: counts.absent,                 color: COLOR.absent },
        ].filter(s => s.value > 0);
        return { label: DAY_LABELS[i], segments };
      }
      return { label: DAY_LABELS[i], segments: [] };
    }));

    // If no records at all, fall back to seeded AttendanceDay week data
    const hasData = bars.some(b => b.segments.length > 0);
    if (!hasData) {
      const doc = await AttendanceDay.findOne({ date });
      if (doc) return res.json(doc.week);
    }
    res.json(bars);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Auto-seed day roster ──────────────────────────────────────────────────────

// POST /api/attendance/init-day  — ensure all active employees have a record for date
router.post("/init-day", async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    const employees = await Employee.find({ status: "active" });
    if (employees.length > 0) {
      const ops = employees.map(e => ({
        updateOne: {
          filter: { date, empId: e.empId },
          update: {
            $setOnInsert: {
              recordId:    `ATT-${e.empId}-${date}`,
              date,
              empId:       e.empId,
              name:        e.name,
              dept:        e.dept,
              role:        e.title || "",
              status:      "absent",
              clockIn:     "",
              clockOut:    "",
              hoursWorked: "",
              location:    e.location || "",
              notes:       "",
              avatar:      e.av || { bg: "#F4DDE8", fg: "#6F1947" },
            },
          },
          upsert: true,
        },
      }));
      await AttendanceRecord.bulkWrite(ops);
    }
    const records = await AttendanceRecord.find({ date }).sort({ name: 1 });
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Per-employee records ──────────────────────────────────────────────────────

// GET /api/attendance/records?date=YYYY-MM-DD&dept=ops&status=present
router.get("/records", async (req, res) => {
  try {
    const { date, dept, status } = req.query;
    const filter = {};
    if (date)   filter.date   = date;
    if (dept)   filter.dept   = dept;
    if (status) filter.status = status;
    const docs = await AttendanceRecord.find(filter).sort({ name: 1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/attendance/records/:recordId
router.get("/records/:recordId", async (req, res) => {
  try {
    const doc = await AttendanceRecord.findOne({ recordId: req.params.recordId });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/attendance/records  — create or upsert a record
router.post("/records", async (req, res) => {
  try {
    const { date, empId } = req.body;
    if (!date || !empId) return res.status(400).json({ error: "date and empId required" });
    const recordId = `ATT-${empId}-${date}`;
    const doc = await AttendanceRecord.findOneAndUpdate(
      { recordId },
      { ...req.body, recordId },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/attendance/records/:recordId  — partial update (clock-out, notes, status)
router.patch("/records/:recordId", async (req, res) => {
  try {
    const doc = await AttendanceRecord.findOneAndUpdate(
      { recordId: req.params.recordId },
      { $set: req.body },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/attendance/records/:recordId
router.delete("/records/:recordId", async (req, res) => {
  try {
    const doc = await AttendanceRecord.findOneAndDelete({ recordId: req.params.recordId });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/attendance  — list all AttendanceDay docs (legacy)
router.get("/", async (req, res) => {
  try {
    const docs = await AttendanceDay.find().sort({ date: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

const express         = require("express");
const router          = express.Router();
const SalaryStructure = require("../models/SalaryStructure");
const SalaryChange    = require("../models/SalaryChange");

router.get("/", async (req, res) => {
  try {
    const docs = await SalaryStructure.find().sort({ empName: 1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:empId", async (req, res) => {
  try {
    const doc = await SalaryStructure.findOne({ empId: req.params.empId });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await SalaryStructure.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT — update structure and log change
router.put("/:empId", async (req, res) => {
  try {
    const { reason, approvedBy, ...update } = req.body;
    const prev = await SalaryStructure.findOne({ empId: req.params.empId });
    const doc  = await SalaryStructure.findOneAndUpdate(
      { empId: req.params.empId },
      update,
      { new: true, runValidators: true, upsert: true }
    );

    // Log the change
    const prevNet = prev ? calcNet(prev) : 0;
    const newNet  = calcNet(doc);
    const changeId = "SC-" + Date.now().toString(36).toUpperCase();
    await SalaryChange.create({
      changeId,
      empId:     doc.empId,
      empName:   doc.empName,
      dept:      doc.dept,
      component: "Salary structure",
      changeType:"structure",
      fromAmount: prevNet,
      toAmount:   newNet,
      reason:     reason || "Manual update",
      effectiveDate: update.effectiveDate || new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }),
      approvedBy: approvedBy || "HR",
    });

    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/salary-changes
router.get("/changes/all", async (req, res) => {
  try {
    const filter = {};
    if (req.query.empId) filter.empId = req.query.empId;
    if (req.query.changeType) filter.changeType = req.query.changeType;
    const docs = await SalaryChange.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function calcNet(s) {
  const base  = s.base || 0;
  const allow = Object.values(s.allowances || {}).reduce((t, v) => t + (v || 0), 0);
  const ot    = calcOt(s.overtime, base);
  const ded   = Object.values(s.deductions || {}).reduce((t, v) => t + (v || 0), 0);
  return base + allow + ot - ded;
}

function calcOt(ot, base) {
  if (!ot || !ot.method || ot.method === "none") return 0;
  const hr = base / 176;
  const dr = base / 22;
  switch (ot.method) {
    case "hourly_1_5": return Math.round(hr * 1.5 * (ot.hoursPerMonth || 0));
    case "hourly_2_0": return Math.round(hr * 2.0 * (ot.hoursPerMonth || 0));
    case "daily":      return Math.round(dr * (ot.rateMultiplier || 1.5) * (ot.daysPerMonth || 0));
    case "flat":       return ot.flatAmount || 0;
    case "percent":    return Math.round(base * ((ot.percentageOfBase || 0) / 100));
    default:           return 0;
  }
}

module.exports = router;

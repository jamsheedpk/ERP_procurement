const express    = require("express");
const router     = express.Router();
const PayrollRun = require("../models/PayrollRun");

router.get("/", async (req, res) => {
  try {
    const docs = await PayrollRun.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/latest", async (req, res) => {
  try {
    const doc = await PayrollRun.findOne().sort({ createdAt: -1 });
    if (!doc) return res.status(404).json({ error: "No payroll run found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await PayrollRun.findOne({ runId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await PayrollRun.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const doc = await PayrollRun.findOneAndUpdate({ runId: req.params.id }, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const doc = await PayrollRun.findOneAndUpdate({ runId: req.params.id }, { status }, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/payroll/:id/stages/:stageIdx  — toggle a stage done/undone
router.patch("/:id/stages/:stageIdx", async (req, res) => {
  try {
    const doc = await PayrollRun.findOne({ runId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    const idx = parseInt(req.params.stageIdx);
    if (idx < 0 || idx >= doc.stages.length) return res.status(400).json({ error: "Invalid stage index" });
    doc.stages[idx].done = req.body.done;
    if (req.body.done && req.body.at) doc.stages[idx].at = req.body.at;
    if (!req.body.done) doc.stages[idx].at = null;
    doc.markModified("stages");
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/payroll/:id/lines/:empId  — update a payroll line (status, bonus, overtime)
router.patch("/:id/lines/:empId", async (req, res) => {
  try {
    const doc = await PayrollRun.findOne({ runId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    const lineIdx = doc.lines.findIndex(l => l.empId === req.params.empId);
    if (lineIdx === -1) return res.status(404).json({ error: "Line not found" });
    const fields = ["status", "overtime", "bonus", "base", "allowances", "deductions"];
    fields.forEach(f => { if (req.body[f] !== undefined) doc.lines[lineIdx][f] = req.body[f]; });
    // Recompute net
    const l = doc.lines[lineIdx];
    l.net = l.base + l.allowances + (l.overtime || 0) + (l.bonus || 0) - l.deductions;
    doc.markModified("lines");
    // Recompute run-level totals
    doc.gross      = doc.lines.reduce((s, ln) => s + ln.base + ln.allowances + (ln.overtime || 0) + (ln.bonus || 0), 0);
    doc.netPay     = doc.lines.reduce((s, ln) => s + ln.net, 0);
    doc.deductions = doc.lines.reduce((s, ln) => s + ln.deductions, 0);
    doc.bonuses    = doc.lines.reduce((s, ln) => s + (ln.overtime || 0) + (ln.bonus || 0), 0);
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;

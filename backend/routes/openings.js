const express   = require("express");
const router    = express.Router();
const Opening   = require("../models/Opening");
const Candidate = require("../models/Candidate");

router.get("/", async (req, res) => {
  try {
    const { dept, status } = req.query;
    const filter = {};
    if (dept)   filter.dept   = dept;
    if (status) filter.status = status;
    const docs = await Opening.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Opening.findOne({ jobId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await Opening.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const doc = await Opening.findOneAndUpdate({ jobId: req.params.id }, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const doc = await Opening.findOneAndUpdate({ jobId: req.params.id }, { status }, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Recompute stage counts + applicants from actual Candidate records
router.patch("/:id/counts", async (req, res) => {
  try {
    const agg = await Candidate.aggregate([
      { $match: { jobId: req.params.id } },
      { $group: { _id: "$stage", n: { $sum: 1 } } },
    ]);
    const stage = { applied: 0, screen: 0, interview: 0, offer: 0, hired: 0 };
    agg.forEach(({ _id, n }) => { if (stage[_id] !== undefined) stage[_id] = n; });
    const applicants = Object.values(stage).reduce((s, v) => s + v, 0);
    const doc = await Opening.findOneAndUpdate(
      { jobId: req.params.id },
      { stage, applicants },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await Opening.findOneAndDelete({ jobId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

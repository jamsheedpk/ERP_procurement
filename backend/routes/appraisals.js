const express   = require("express");
const router    = express.Router();
const Appraisal = require("../models/Appraisal");

// GET /api/appraisals?cycleId=CYC-H1-2026
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.cycleId) filter.cycleId = req.query.cycleId;
    const docs = await Appraisal.find(filter).sort({ dept: 1, empName: 1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Appraisal.findOne({ appraisalId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await Appraisal.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    const doc = await Appraisal.findOneAndUpdate(
      { appraisalId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await Appraisal.findOneAndDelete({ appraisalId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

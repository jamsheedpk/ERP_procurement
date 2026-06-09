const express   = require("express");
const router    = express.Router();
const Candidate = require("../models/Candidate");

router.get("/", async (req, res) => {
  try {
    const { jobId, stage } = req.query;
    const filter = {};
    if (jobId) filter.jobId = jobId;
    if (stage) filter.stage = stage;
    const docs = await Candidate.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Candidate.findOne({ candidateId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await Candidate.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const doc = await Candidate.findOneAndUpdate({ candidateId: req.params.id }, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id/stage", async (req, res) => {
  try {
    const { stage } = req.body;
    const doc = await Candidate.findOneAndUpdate({ candidateId: req.params.id }, { stage }, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id/rating", async (req, res) => {
  try {
    const { rating } = req.body;
    const doc = await Candidate.findOneAndUpdate({ candidateId: req.params.id }, { rating }, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id/notes", async (req, res) => {
  try {
    const { notes } = req.body;
    const doc = await Candidate.findOneAndUpdate({ candidateId: req.params.id }, { notes }, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await Candidate.findOneAndDelete({ candidateId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

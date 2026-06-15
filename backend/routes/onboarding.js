const express    = require("express");
const router     = express.Router();
const Onboarding = require("../models/Onboarding");

// GET /api/onboarding?type=onboard|offboard
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    const docs = await Onboarding.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/onboarding/:id
router.get("/:id", async (req, res) => {
  try {
    const doc = await Onboarding.findOne({ boardingId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/onboarding
router.post("/", async (req, res) => {
  try {
    const count = await Onboarding.countDocuments({ type: req.body.type });
    const prefix = req.body.type === "onboard" ? "OB" : req.body.type === "longLeave" ? "LLL" : "OFB";
    const boardingId = `${prefix}-${String(count + 1).padStart(3, "0")}`;
    const doc = await Onboarding.create({ ...req.body, boardingId });
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/onboarding/:id/stage  — update current stage
router.patch("/:id/stage", async (req, res) => {
  try {
    const doc = await Onboarding.findOne({ boardingId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    doc.stage = req.body.stage;
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/onboarding/:id/tasks/:taskIdx  — toggle a single task
router.patch("/:id/tasks/:taskIdx", async (req, res) => {
  try {
    const doc = await Onboarding.findOne({ boardingId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    const idx = parseInt(req.params.taskIdx, 10);
    if (idx < 0 || idx >= doc.tasks.length) return res.status(400).json({ error: "Invalid task index" });
    doc.tasks[idx].done = req.body.done !== undefined ? req.body.done : !doc.tasks[idx].done;
    doc.markModified("tasks");
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/onboarding/:id  — update notes or other fields
router.patch("/:id", async (req, res) => {
  try {
    const doc = await Onboarding.findOneAndUpdate(
      { boardingId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/onboarding/:id
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Onboarding.findOneAndDelete({ boardingId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

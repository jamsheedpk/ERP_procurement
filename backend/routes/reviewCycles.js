const express     = require("express");
const router      = express.Router();
const ReviewCycle = require("../models/ReviewCycle");

router.get("/", async (req, res) => {
  try {
    const docs = await ReviewCycle.find().sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await ReviewCycle.findOne({ cycleId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await ReviewCycle.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    const doc = await ReviewCycle.findOneAndUpdate(
      { cycleId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await ReviewCycle.findOneAndDelete({ cycleId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

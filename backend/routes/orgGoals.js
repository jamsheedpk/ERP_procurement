const express = require("express");
const router  = express.Router();
const OrgGoal = require("../models/OrgGoal");

// GET /api/org-goals?cycleId=CYC-H1-2026
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.cycleId) filter.cycleId = req.query.cycleId;
    const docs = await OrgGoal.find(filter).sort({ createdAt: 1 }).lean();
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await OrgGoal.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    const doc = await OrgGoal.findOneAndUpdate(
      { goalId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await OrgGoal.findOneAndDelete({ goalId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

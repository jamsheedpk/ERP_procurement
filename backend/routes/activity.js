const express  = require("express");
const router   = express.Router();
const Activity = require("../models/Activity");

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const docs = await Activity.find().sort({ createdAt: -1 }).limit(limit);
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await Activity.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await Activity.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

const express   = require("express");
const router    = express.Router();
const LeaveType = require("../models/LeaveType");

router.get("/", async (req, res) => {
  try {
    const docs = await LeaveType.find().sort({ typeId: 1 }).lean();
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await LeaveType.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const doc = await LeaveType.findOneAndUpdate({ typeId: req.params.id }, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await LeaveType.findOneAndDelete({ typeId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

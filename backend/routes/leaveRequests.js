const express      = require("express");
const router       = express.Router();
const LeaveRequest = require("../models/LeaveRequest");

router.get("/", async (req, res) => {
  try {
    const { status, empId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (empId)  filter.empId  = empId;
    const docs = await LeaveRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await LeaveRequest.findOne({ leaveId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await LeaveRequest.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const doc = await LeaveRequest.findOneAndUpdate({ leaveId: req.params.id }, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const doc = await LeaveRequest.findOneAndUpdate({ leaveId: req.params.id }, { status }, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await LeaveRequest.findOneAndDelete({ leaveId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

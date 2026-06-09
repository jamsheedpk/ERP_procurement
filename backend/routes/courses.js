const express = require("express");
const router  = express.Router();
const Course  = require("../models/Course");

router.get("/", async (req, res) => {
  try {
    const docs = await Course.find().sort({ createdAt: 1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Course.findOne({ courseId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await Course.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    const doc = await Course.findOneAndUpdate(
      { courseId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Course.findOneAndDelete({ courseId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bulk enroll/unenroll: body { add: [empId], remove: [empId] }
router.patch("/:id/enrollment", async (req, res) => {
  try {
    const { add = [], remove = [] } = req.body;
    const ops = {};
    if (add.length)    ops.$addToSet = { enrolledEmpIds: { $each: add } };
    if (remove.length) ops.$pull     = { enrolledEmpIds: { $in: remove }, completedEmpIds: { $in: remove } };
    const doc = await Course.findOneAndUpdate({ courseId: req.params.id }, ops, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Toggle completion for one employee: body { empId, done: bool }
router.patch("/:id/complete", async (req, res) => {
  try {
    const { empId, done } = req.body;
    const op = done
      ? { $addToSet: { completedEmpIds: empId } }
      : { $pull:     { completedEmpIds: empId } };
    const doc = await Course.findOneAndUpdate({ courseId: req.params.id }, op, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;

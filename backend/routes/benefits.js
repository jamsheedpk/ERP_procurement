const express = require("express");
const router  = express.Router();
const Benefit = require("../models/Benefit");

router.get("/", async (req, res) => {
  try {
    const docs = await Benefit.find().sort({ createdAt: 1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Benefit.findOne({ benefitId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await Benefit.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    const doc = await Benefit.findOneAndUpdate(
      { benefitId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/benefits/:id/enroll   { empId }  — add employee
router.patch("/:id/enroll", async (req, res) => {
  try {
    const { empId } = req.body;
    const doc = await Benefit.findOneAndUpdate(
      { benefitId: req.params.id },
      { $addToSet: { enrolledEmpIds: empId } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/benefits/:id/unenroll { empId }  — remove employee
router.patch("/:id/unenroll", async (req, res) => {
  try {
    const { empId } = req.body;
    const doc = await Benefit.findOneAndUpdate(
      { benefitId: req.params.id },
      { $pull: { enrolledEmpIds: empId } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await Benefit.findOneAndDelete({ benefitId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

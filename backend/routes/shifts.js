const express = require("express");
const router  = express.Router();
const Shift   = require("../models/Shift");

// GET /api/shifts?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from && to) filter.date = { $gte: from, $lte: to };
    else if (from) filter.date = { $gte: from };
    const docs = await Shift.find(filter).sort({ dept: 1, empName: 1, date: 1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/shifts/:empId/:date  — upsert one assignment
router.put("/:empId/:date", async (req, res) => {
  try {
    const { empId, date } = req.params;
    const shiftId = `SHF-${empId}-${date}`;
    const doc = await Shift.findOneAndUpdate(
      { empId, date },
      { $set: { shiftId, empId, date, ...req.body } },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/shifts/:empId/:date
router.delete("/:empId/:date", async (req, res) => {
  try {
    await Shift.findOneAndDelete({ empId: req.params.empId, date: req.params.date });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

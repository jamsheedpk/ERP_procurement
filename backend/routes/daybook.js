const express = require("express");
const router  = express.Router();
const DayBook = require("../models/DayBook");

// GET /api/daybook?date=&from=&to=&type=
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.entryType = req.query.type;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.date) {
      filter.date = req.query.date;
    } else if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to)   filter.date.$lte = req.query.to;
    }
    const docs = await DayBook.find(filter).sort({ date: 1, createdAt: 1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/daybook
router.post("/", async (req, res) => {
  try {
    const entryId = "DB-" + Date.now().toString(36).toUpperCase();
    const body    = { ...req.body, entryId };
    if (body.debit)  body.debit  = parseFloat(body.debit)  || 0;
    if (body.credit) body.credit = parseFloat(body.credit) || 0;
    const doc = await DayBook.create(body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/daybook/:id
router.patch("/:id", async (req, res) => {
  try {
    const doc = await DayBook.findOneAndUpdate(
      { entryId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/daybook/:id
router.delete("/:id", async (req, res) => {
  try {
    await DayBook.findOneAndDelete({ entryId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

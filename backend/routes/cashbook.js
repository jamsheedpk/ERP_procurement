const express  = require("express");
const router   = express.Router();
const CashBook = require("../models/CashBook");

// GET /api/cashbook?from=&to=&type=&mode=
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.entryType   = req.query.type;
    if (req.query.mode) filter.paymentMode = req.query.mode;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to)   filter.date.$lte = req.query.to;
    }
    const docs = await CashBook.find(filter).sort({ date: 1, createdAt: 1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/cashbook
router.post("/", async (req, res) => {
  try {
    const entryId = "CB-" + Date.now().toString(36).toUpperCase();
    const body    = { ...req.body, entryId };
    if (body.amount) body.amount = parseFloat(body.amount) || 0;
    const doc = await CashBook.create(body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/cashbook/:id
router.patch("/:id", async (req, res) => {
  try {
    const doc = await CashBook.findOneAndUpdate(
      { entryId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/cashbook/:id
router.delete("/:id", async (req, res) => {
  try {
    await CashBook.findOneAndDelete({ entryId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

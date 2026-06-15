const express    = require("express");
const router     = express.Router();
const Quotation  = require("../models/Quotation");

function computeTotals(body) {
  if (body.items) {
    body.items = body.items.map(function(it, i) {
      it.sNo   = i + 1;
      it.total = (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0);
      return it;
    });
  }
  body.subtotal    = (body.items || []).reduce(function(s, it) { return s + (it.total || 0); }, 0);
  body.discountAmt = body.subtotal * ((parseFloat(body.discountPct) || 0) / 100);
  body.taxAmt      = (body.subtotal - body.discountAmt) * ((parseFloat(body.taxPct) || 5) / 100);
  body.grandTotal  = body.subtotal - body.discountAmt + body.taxAmt;
  return body;
}

// GET /api/quotations?status=&projectId=&search=
router.get("/", async function(req, res) {
  try {
    var filter = {};
    if (req.query.status)    filter.status    = req.query.status;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.search) {
      filter.$or = [
        { projectTitle: { $regex: req.query.search, $options: "i" } },
        { clientName:   { $regex: req.query.search, $options: "i" } },
        { quotationId:  { $regex: req.query.search, $options: "i" } },
        { projectName:  { $regex: req.query.search, $options: "i" } },
      ];
    }
    var docs = await Quotation.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/quotations
router.post("/", async function(req, res) {
  try {
    var body = computeTotals(Object.assign({}, req.body));
    body.quotationId = "QUO-" + Date.now().toString(36).toUpperCase();
    var doc = await Quotation.create(body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/quotations/:id
router.patch("/:id", async function(req, res) {
  try {
    var body = computeTotals(Object.assign({}, req.body));
    var doc = await Quotation.findOneAndUpdate(
      { quotationId: req.params.id },
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/quotations/:id
router.delete("/:id", async function(req, res) {
  try {
    await Quotation.findOneAndDelete({ quotationId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

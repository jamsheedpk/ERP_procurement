const express   = require("express");
const router    = express.Router();
const Invoice   = require("../models/Invoice");
const Quotation = require("../models/Quotation");

// Recompute line totals, document totals and outstanding balance.
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
  body.taxAmt      = (body.subtotal - body.discountAmt) * ((parseFloat(body.taxPct) || 0) / 100);
  body.grandTotal  = body.subtotal - body.discountAmt + body.taxAmt;
  body.balanceDue  = body.grandTotal - (parseFloat(body.amountPaid) || 0);
  return body;
}

// Keep status consistent with how much has been paid (unless explicitly cancelled).
function syncStatus(doc) {
  if (doc.status === "cancelled") return doc;
  const paid = doc.amountPaid || 0;
  if (paid <= 0)                  doc.status = "unpaid";
  else if (paid < doc.grandTotal) doc.status = "partial";
  else                            doc.status = "paid";
  return doc;
}

// GET /api/invoices?status=&projectId=&search=
router.get("/", async function(req, res) {
  try {
    var filter = {};
    if (req.query.status)    filter.status    = req.query.status;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.search) {
      filter.$or = [
        { projectTitle: { $regex: req.query.search, $options: "i" } },
        { clientName:   { $regex: req.query.search, $options: "i" } },
        { invoiceId:    { $regex: req.query.search, $options: "i" } },
        { quotationId:  { $regex: req.query.search, $options: "i" } },
        { projectName:  { $regex: req.query.search, $options: "i" } },
      ];
    }
    var docs = await Invoice.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/invoices/:id
router.get("/:id", async function(req, res) {
  try {
    var doc = await Invoice.findOne({ invoiceId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/invoices
router.post("/", async function(req, res) {
  try {
    var body = computeTotals(Object.assign({}, req.body));
    body.invoiceId = "INV-" + Date.now().toString(36).toUpperCase();
    var doc = new Invoice(body);
    syncStatus(doc);
    await doc.save();
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/invoices/from-quotation/:quotationId — convert a quotation into an invoice
router.post("/from-quotation/:quotationId", async function(req, res) {
  try {
    var quo = await Quotation.findOne({ quotationId: req.params.quotationId });
    if (!quo) return res.status(404).json({ error: "Quotation not found" });
    if (quo.invoiceId) return res.status(409).json({ error: "Already invoiced as " + quo.invoiceId });

    var today = new Date().toISOString().slice(0, 10);
    var invoice = new Invoice({
      invoiceId:     "INV-" + Date.now().toString(36).toUpperCase(),
      quotationId:   quo.quotationId,
      projectId:     quo.projectId,
      projectName:   quo.projectName,
      partyId:       quo.partyId,
      partyName:     quo.partyName,
      date:          today,
      reference:     quo.reference || quo.quotationId,
      clientName:    quo.clientName,
      clientAddress: quo.clientAddress,
      clientPhone:   quo.clientPhone,
      clientEmail:   quo.clientEmail,
      projectTitle:  quo.projectTitle,
      location:      quo.location,
      introduction:  quo.introduction,
      scopeOfWork:   quo.scopeOfWork,
      items:         (quo.items || []).map(function(it) { return Object.assign({}, it.toObject ? it.toObject() : it); }),
      subtotal:      quo.subtotal,
      discountPct:   quo.discountPct,
      discountAmt:   quo.discountAmt,
      taxPct:        quo.taxPct,
      taxAmt:        quo.taxAmt,
      grandTotal:    quo.grandTotal,
      amountPaid:    0,
      balanceDue:    quo.grandTotal,
      paymentTerms:  quo.paymentTerms,
      currency:      quo.currency,
      status:        "unpaid",
    });
    await invoice.save();

    // Link the invoice back onto the quotation so it can't be converted twice.
    quo.invoiceId = invoice.invoiceId;
    await quo.save();

    res.status(201).json(invoice);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/invoices/:id
router.patch("/:id", async function(req, res) {
  try {
    var existing = await Invoice.findOne({ invoiceId: req.params.id });
    if (!existing) return res.status(404).json({ error: "Not found" });

    var body = Object.assign({}, req.body);
    // Picking a status from the dropdown (status given, no explicit amountPaid)
    // keeps the money in step with the label: Paid => fully paid, Unpaid => nothing.
    if (body.status != null && body.amountPaid == null) {
      if (body.status === "paid")   body.amountPaid = existing.grandTotal;
      if (body.status === "unpaid") body.amountPaid = 0;
    }
    // Only recompute money fields when items / discount / tax / payment changed.
    if (body.items || body.discountPct != null || body.taxPct != null || body.amountPaid != null) {
      var merged = Object.assign(existing.toObject(), body);
      body = computeTotals(merged);
    }
    Object.assign(existing, body);
    // Auto-status unless the caller explicitly set one (e.g. cancelled).
    if (req.body.status == null) syncStatus(existing);
    await existing.save();
    res.json(existing);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/invoices/:id
router.delete("/:id", async function(req, res) {
  try {
    var doc = await Invoice.findOneAndDelete({ invoiceId: req.params.id });
    // Unlink from the source quotation so it can be converted again.
    if (doc && doc.quotationId) {
      await Quotation.findOneAndUpdate({ quotationId: doc.quotationId }, { $set: { invoiceId: "" } });
    }
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

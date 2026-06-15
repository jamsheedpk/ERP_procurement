const express            = require("express");
const router             = express.Router();
const PaymentApplication = require("../models/PaymentApplication");
const { genId }          = require("../core/index");

// GET /api/payment-applications
router.get("/", async function(req, res) {
  try {
    var filter = {};
    if (req.query.status)    filter.status    = req.query.status;
    if (req.query.procId)    filter.procId    = req.query.procId;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    var docs = await PaymentApplication.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/payment-applications/:id
router.get("/:id", async function(req, res) {
  try {
    var doc = await PaymentApplication.findOne({ appId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/payment-applications
router.post("/", async function(req, res) {
  try {
    var body = Object.assign({}, req.body);
    body.appId = body.appId || genId("PA");
    var doc = await PaymentApplication.create(body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/payment-applications/:id
router.patch("/:id", async function(req, res) {
  try {
    var doc = await PaymentApplication.findOneAndUpdate(
      { appId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/payment-applications/:id
router.delete("/:id", async function(req, res) {
  try {
    await PaymentApplication.findOneAndDelete({ appId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

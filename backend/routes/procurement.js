const express     = require("express");
const router      = express.Router();
const Procurement = require("../models/Procurement");
const { PROC_STAGES, STAGE_KEYS } = Procurement;

const stageMeta = key => PROC_STAGES.find(s => s.key === key) || null;

// GET /api/procurement/stages — expose the canonical 12-stage definition
router.get("/stages", (req, res) => res.json(PROC_STAGES));

// GET /api/procurement?stage=&status=&department=&search=
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.stage)      filter.currentStage = req.query.stage;
    if (req.query.status)     filter.status       = req.query.status;
    if (req.query.department) filter.department    = req.query.department;
    if (req.query.search) {
      filter.$or = [
        { title:  { $regex: req.query.search, $options: "i" } },
        { procId: { $regex: req.query.search, $options: "i" } },
        { vendor: { $regex: req.query.search, $options: "i" } },
      ];
    }
    const docs = await Procurement.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Procurement.findOne({ procId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const procId = "PRC-" + Date.now().toString(36).toUpperCase();
    const doc = await Procurement.create({ ...req.body, procId, currentStage: "enquiry" });
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    // Guard immutable identity fields
    const { procId, _id, ...rest } = req.body;
    const doc = await Procurement.findOneAndUpdate(
      { procId: req.params.id },
      { $set: rest },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

/*
 * POST /api/procurement/:id/advance
 * Sign off the CURRENT stage (appending a history entry) and move to the next one.
 * Completing the final stage marks the whole request `completed`.
 * Body: { by, note, patch }  — `patch` optionally updates stage fields (poNumber, etc.)
 */
router.post("/:id/advance", async (req, res) => {
  try {
    const doc = await Procurement.findOne({ procId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });

    const { by = "", note = "", patch = {} } = req.body || {};
    const idx  = STAGE_KEYS.indexOf(doc.currentStage);
    const meta = stageMeta(doc.currentStage);

    // Apply any stage-specific field updates that came with the sign-off
    const { procId, _id, ...rest } = patch;
    Object.assign(doc, rest);

    doc.history.push({
      stage:  doc.currentStage,
      label:  meta ? meta.label : doc.currentStage,
      action: meta ? meta.action : "",
      by, note,
      at: new Date(),
    });

    if (idx >= 0 && idx < STAGE_KEYS.length - 1) {
      doc.currentStage = STAGE_KEYS[idx + 1];
    } else {
      doc.status = "completed";   // final stage signed off
    }

    await doc.save();
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/procurement/:id/stage — jump to a specific stage (e.g. send back). Body: { stage }
router.post("/:id/stage", async (req, res) => {
  try {
    const { stage } = req.body || {};
    if (!STAGE_KEYS.includes(stage)) return res.status(400).json({ error: "Invalid stage" });
    const doc = await Procurement.findOneAndUpdate(
      { procId: req.params.id },
      { $set: { currentStage: stage, status: "in_progress" } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Procurement.findOneAndDelete({ procId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

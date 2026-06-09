const express     = require("express");
const router      = express.Router();
const Project     = require("../models/Project");
const Procurement = require("../models/Procurement");

// Project priority enum (low/medium/high/urgent) → Procurement enum (low/normal/high/urgent).
const PROC_PRIORITY = { low: "low", medium: "normal", high: "high", urgent: "urgent" };

// The Procurement fields that mirror their originating Project, so a quotation
// assignment / edit on the project flows through to its lifecycle entry.
function procFieldsFromProject(p) {
  return {
    title:           p.title,
    projectName:     p.title,
    estValue:        p.approvedAmount || p.quotationAmount || 0,
    quotationRef:    p.quotationRef || "",
    quotationDate:   p.quotationDate || "",
    quotationAmount: p.quotationAmount || 0,
    priority:        PROC_PRIORITY[p.priority] || "normal",
  };
}

// GET /api/projects?stage=&type=&priority=&search=
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.stage)    filter.stage    = req.query.stage;
    if (req.query.type)     filter.type     = req.query.type;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.search) {
      filter.$or = [
        { title:     { $regex: req.query.search, $options: "i" } },
        { partyName: { $regex: req.query.search, $options: "i" } },
        { location:  { $regex: req.query.search, $options: "i" } },
      ];
    }
    const docs = await Project.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects
router.post("/", async (req, res) => {
  try {
    const projectId = "PRJ-" + Date.now().toString(36).toUpperCase();
    const doc = await Project.create(Object.assign({}, req.body, { projectId }));

    // Auto-open a linked Procurement Lifecycle entry for the new project,
    // starting at the first stage (Enquiry). A failure here must not block
    // project creation, so it's isolated in its own try/catch.
    try {
      const procId = "PRC-" + Date.now().toString(36).toUpperCase();
      await Procurement.create({
        procId,
        projectId:    doc.projectId,
        currentStage: "enquiry",
        status:       "in_progress",
        ...procFieldsFromProject(doc),
      });
    } catch (procErr) {
      console.error("Auto-create procurement for", projectId, "failed:", procErr.message);
    }

    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/projects/:id
router.patch("/:id", async (req, res) => {
  try {
    const doc = await Project.findOneAndUpdate(
      { projectId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });

    // Keep the linked Procurement Lifecycle entry's mirrored fields in sync
    // (quotation, estimated value, priority, title). Isolated so it never
    // blocks the project update.
    try {
      await Procurement.findOneAndUpdate(
        { projectId: doc.projectId },
        { $set: procFieldsFromProject(doc) },
        { runValidators: true }
      );
    } catch (procErr) {
      console.error("Sync procurement for", doc.projectId, "failed:", procErr.message);
    }

    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/projects/:id/discussions
router.post("/:id/discussions", async (req, res) => {
  try {
    const { date, notes, outcome, by } = req.body;
    const doc = await Project.findOneAndUpdate(
      { projectId: req.params.id },
      { $push: { discussions: { date: date || "", notes: notes || "", outcome: outcome || "", by: by || "" } } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/projects/:id
router.delete("/:id", async (req, res) => {
  try {
    await Project.findOneAndDelete({ projectId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

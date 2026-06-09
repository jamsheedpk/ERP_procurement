const express = require("express");
const router  = express.Router();
const Project = require("../models/Project");

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

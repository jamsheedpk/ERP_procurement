const express = require("express");
const router  = express.Router();
const Note    = require("../models/Note");

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.empId) filter.empId = req.query.empId;
    const docs = await Note.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await Note.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Note.findOneAndDelete({ noteId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

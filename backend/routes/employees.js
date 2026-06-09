const express  = require("express");
const router   = express.Router();
const Employee = require("../models/Employee");

router.get("/", async (req, res) => {
  try {
    const { dept, status, search } = req.query;
    const filter = {};
    if (dept)   filter.deptId = dept;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: "i" };
    const docs = await Employee.find(filter).sort({ name: 1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Employee.findOne({ empId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await Employee.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const doc = await Employee.findOneAndUpdate({ empId: req.params.id }, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await Employee.findOneAndDelete({ empId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

const express            = require("express");
const router             = express.Router();
const HeadcountSnapshot  = require("../models/HeadcountSnapshot");

router.get("/trend", async (req, res) => {
  try {
    const docs = await HeadcountSnapshot.find().sort({ order: 1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await HeadcountSnapshot.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;

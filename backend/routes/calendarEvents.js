const express       = require("express");
const router        = express.Router();
const CalendarEvent = require("../models/CalendarEvent");

// GET /api/calendar-events?month=YYYY-MM
// Returns { [day]: [{ kind, label }, ...] } keyed by day number
router.get("/", async (req, res) => {
  try {
    const month = req.query.month;
    const filter = month ? { month } : {};
    const docs = await CalendarEvent.find(filter).sort({ day: 1 });

    // Group into { day: [events] } map for easy frontend consumption
    const map = {};
    for (const doc of docs) {
      if (!map[doc.day]) map[doc.day] = [];
      map[doc.day].push({ kind: doc.kind, label: doc.label });
    }
    res.json(map);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const doc = await CalendarEvent.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

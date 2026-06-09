const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema({
  month: { type: String, required: true }, // "YYYY-MM"
  day:   { type: Number, required: true },
  kind:  { type: String, enum: ["leave", "holiday", "wfh", "event"], default: "event" },
  label: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);

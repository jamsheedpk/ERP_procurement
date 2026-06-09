const mongoose = require("mongoose");

const segmentSchema = new mongoose.Schema({
  lbl:   String,
  v:     Number,
  c:     String,
}, { _id: false });

const barSegmentSchema = new mongoose.Schema({
  key:   String,
  value: Number,
  color: String,
}, { _id: false });

const barSchema = new mongoose.Schema({
  label:    String,
  segments: [barSegmentSchema],
}, { _id: false });

const attendanceDaySchema = new mongoose.Schema({
  date:  { type: String, required: true, unique: true }, // "YYYY-MM-DD"
  donut: [segmentSchema],
  week:  [barSchema],
}, { timestamps: true });

module.exports = mongoose.model("AttendanceDay", attendanceDaySchema);

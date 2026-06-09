const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema({
  recordId:    { type: String, required: true, unique: true },
  date:        { type: String, required: true, index: true }, // "YYYY-MM-DD"
  empId:       { type: String, required: true },
  name:        { type: String, default: "" },
  dept:        { type: String, default: "" },
  role:        { type: String, default: "" },
  status:      { type: String, enum: ["present", "late", "wfh", "leave", "absent"], default: "absent" },
  clockIn:     { type: String, default: "" },  // "HH:MM"
  clockOut:    { type: String, default: "" },  // "HH:MM"
  hoursWorked: { type: String, default: "" },  // "8:30"
  location:    { type: String, default: "" },
  notes:       { type: String, default: "" },
  avatar:      {
    bg: { type: String, default: "#F4DDE8" },
    fg: { type: String, default: "#6F1947" },
  },
}, { timestamps: true });

attendanceRecordSchema.index({ date: 1, empId: 1 }, { unique: true });

module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);

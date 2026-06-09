const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema({
  typeId: { type: String, required: true, unique: true },
  name:   { type: String, required: true },
  color:  { type: String, default: "#807379" },
  icon:   { type: String, default: "circle" },
}, { timestamps: true });

module.exports = mongoose.model("LeaveType", leaveTypeSchema);

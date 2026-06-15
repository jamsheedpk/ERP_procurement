const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({
  leaveId:   { type: String, required: true, unique: true },
  empId:     { type: String, required: true },
  emp:       { type: String, required: true },
  dept:      { type: String, default: "" },
  type:      { type: String, default: "annual" },
  typeLbl:   { type: String, default: "" },
  from:      { type: String, required: true },
  to:        { type: String, required: true },
  days:      { type: Number, default: 1 },
  reason:    { type: String, default: "" },
  status:    { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
  submitted: { type: String, default: "" },
  approver:  { type: String, default: "" },
}, { timestamps: true });

leaveRequestSchema.index({ status: 1, createdAt: -1 });
leaveRequestSchema.index({ empId: 1, createdAt: -1 });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);

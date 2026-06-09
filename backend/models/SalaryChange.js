const mongoose = require("mongoose");

const salaryChangeSchema = new mongoose.Schema({
  changeId:      { type: String, required: true, unique: true },
  empId:         { type: String, required: true },
  empName:       { type: String, default: "" },
  dept:          { type: String, default: "" },
  component:     { type: String, default: "Base salary" },
  changeType:    { type: String, enum: ["base","allowance","overtime","deduction","bonus","structure"], default: "base" },
  fromAmount:    { type: Number, default: 0 },
  toAmount:      { type: Number, default: 0 },
  reason:        { type: String, default: "" },
  effectiveDate: { type: String, default: "" },
  approvedBy:    { type: String, default: "HR" },
}, { timestamps: true });

module.exports = mongoose.model("SalaryChange", salaryChangeSchema);

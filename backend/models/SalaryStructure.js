const mongoose = require("mongoose");

const salaryStructureSchema = new mongoose.Schema({
  empId:   { type: String, required: true, unique: true },
  empName: { type: String, default: "" },
  dept:    { type: String, default: "" },
  grade:   { type: String, default: "" },
  base:    { type: Number, default: 0 },
  allowances: {
    housing:       { type: Number, default: 0 },
    transport:     { type: Number, default: 0 },
    food:          { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    other:         { type: Number, default: 0 },
  },
  overtime: {
    method:           { type: String, enum: ["none","hourly_1_5","hourly_2_0","daily","flat","percent"], default: "none" },
    hoursPerMonth:    { type: Number, default: 0 },
    daysPerMonth:     { type: Number, default: 0 },
    rateMultiplier:   { type: Number, default: 1.5 },
    flatAmount:       { type: Number, default: 0 },
    percentageOfBase: { type: Number, default: 0 },
  },
  deductions: {
    loan:      { type: Number, default: 0 },
    advance:   { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    other:     { type: Number, default: 0 },
  },
  effectiveDate: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("SalaryStructure", salaryStructureSchema);

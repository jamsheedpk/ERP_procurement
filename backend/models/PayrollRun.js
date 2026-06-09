const mongoose = require("mongoose");

const stageSchema = new mongoose.Schema({
  id:    String,
  label: String,
  done:  { type: Boolean, default: false },
  at:    { type: String, default: null },
  due:   { type: String, default: null },
}, { _id: false });

const flagSchema = new mongoose.Schema({
  kind:  String,
  dept:  String,
  text:  String,
  count: Number,
}, { _id: false });

const lineSchema = new mongoose.Schema({
  empId:      String,
  emp:        String,
  dept:       String,
  base:       Number,
  allowances: Number,
  overtime:   { type: Number, default: 0 },
  bonus:      { type: Number, default: 0 },
  deductions: Number,
  net:        Number,
  status:     { type: String, enum: ["ready", "review", "blocked", "paid"], default: "ready" },
}, { _id: false });

const payrollRunSchema = new mongoose.Schema({
  runId:     { type: String, required: true, unique: true },
  period:    { type: String, required: true },
  runDate:   String,
  headcount: Number,
  gross:     Number,
  netPay:    Number,
  deductions:Number,
  bonuses:   Number,
  status:    { type: String, enum: ["draft", "review", "approved", "paid"], default: "draft" },
  stages:    [stageSchema],
  flags:     [flagSchema],
  lines:     [lineSchema],
}, { timestamps: true });

module.exports = mongoose.model("PayrollRun", payrollRunSchema);

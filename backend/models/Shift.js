const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  shiftId: { type: String, required: true, unique: true },
  empId:   { type: String, required: true },
  date:    { type: String, required: true },   // YYYY-MM-DD
  type:    { type: String, enum: ["morning","day","evening","night","off","leave"], default: "day" },
  empName: { type: String, default: "" },
  dept:    { type: String, default: "" },
  role:    { type: String, default: "" },
  avatar:  { type: Object, default: {} },
}, { timestamps: true });

shiftSchema.index({ empId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Shift", shiftSchema);

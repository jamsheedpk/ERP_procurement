const mongoose = require("mongoose");

const reviewCycleSchema = new mongoose.Schema({
  cycleId:  { type: String, required: true, unique: true },
  name:     { type: String, required: true },
  period:   { type: String, default: "" },
  deadline: { type: String, default: "" },
  status:   { type: String, enum: ["draft","active","closed"], default: "active" },
}, { timestamps: true });

module.exports = mongoose.model("ReviewCycle", reviewCycleSchema);

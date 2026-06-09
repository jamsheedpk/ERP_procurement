const mongoose = require("mongoose");

const orgGoalSchema = new mongoose.Schema({
  goalId:   { type: String, required: true, unique: true },
  cycleId:  { type: String, required: true },
  label:    { type: String, required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  due:      { type: String, default: "" },
  owner:    { type: String, default: "" },
  status:   { type: String, enum: ["on_track","at_risk","completed"], default: "on_track" },
}, { timestamps: true });

module.exports = mongoose.model("OrgGoal", orgGoalSchema);

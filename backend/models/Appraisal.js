const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  label:    { type: String, default: "" },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  due:      { type: String, default: "" },
}, { _id: false });

const appraisalSchema = new mongoose.Schema({
  appraisalId:    { type: String, required: true, unique: true },
  cycleId:        { type: String, required: true },
  empId:          { type: String, required: true },
  empName:        { type: String, default: "" },
  dept:           { type: String, default: "" },
  role:           { type: String, default: "" },
  avatar:         { bg: { type: String, default: "" }, fg: { type: String, default: "" } },
  rating:         { type: Number, default: null, min: 1, max: 5 },
  reviewStatus:   { type: String, enum: ["not_started","in_progress","completed"], default: "not_started" },
  managerComment: { type: String, default: "" },
  selfComment:    { type: String, default: "" },
  goals:          { type: [goalSchema], default: [] },
}, { timestamps: true });

appraisalSchema.index({ cycleId: 1, empId: 1 }, { unique: true });

module.exports = mongoose.model("Appraisal", appraisalSchema);

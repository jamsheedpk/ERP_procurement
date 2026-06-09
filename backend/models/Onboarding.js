const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  label: { type: String, required: true },
  stage: { type: String, required: true },
  done:  { type: Boolean, default: false },
}, { _id: false });

const onboardingSchema = new mongoose.Schema({
  boardingId: { type: String, required: true, unique: true },
  type:       { type: String, enum: ["onboard", "offboard", "longLeave"], required: true },
  empId:      { type: String, required: true },
  name:       { type: String, required: true },
  dept:       { type: String, default: "" },
  role:       { type: String, default: "" },
  stage:      { type: String, required: true },
  startDate:  { type: String, default: "" },
  endDate:    { type: String, default: "" },
  avatar:     { bg: { type: String, default: "#F4DDE8" }, fg: { type: String, default: "#6F1947" } },
  tasks:      [taskSchema],
  notes:      { type: String, default: "" },
}, { timestamps: true });

// Computed progress: % of tasks done
onboardingSchema.virtual("progress").get(function () {
  if (!this.tasks.length) return 0;
  return Math.round(this.tasks.filter(t => t.done).length / this.tasks.length * 100);
});

onboardingSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Onboarding", onboardingSchema);

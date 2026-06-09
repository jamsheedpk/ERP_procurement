const mongoose = require("mongoose");

const tierSchema = new mongoose.Schema({
  label: { type: String, default: "" },
  count: { type: Number, default: 0 },
  cost:  { type: Number, default: 0 },
}, { _id: false });

const benefitSchema = new mongoose.Schema({
  benefitId:      { type: String, required: true, unique: true },
  name:           { type: String, required: true },
  icon:           { type: String, default: "gift" },
  color:          { type: String, default: "#6F1947" },
  provider:       { type: String, default: "" },
  coverage:       { type: String, default: "" },
  costPerEmp:     { type: Number, default: 0 },
  desc:           { type: String, default: "" },
  active:         { type: Boolean, default: true },
  tiers:          [tierSchema],
  enrolledEmpIds: [{ type: String }],
}, { timestamps: true });

benefitSchema.virtual("enrolledCount").get(function () {
  return this.enrolledEmpIds.length;
});
benefitSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Benefit", benefitSchema);

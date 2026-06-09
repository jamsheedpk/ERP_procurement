const mongoose = require("mongoose");

const renewalSchema = new mongoose.Schema({
  kind:     { type: String, required: true },
  emp:      { type: String, required: true },
  empId:    { type: String, required: true },
  expires:  { type: String, required: true },
  days:     { type: Number, default: 0 },
  severity: { type: String, enum: ["danger", "warning", "info"], default: "info" },
}, { timestamps: true });

module.exports = mongoose.model("Renewal", renewalSchema);

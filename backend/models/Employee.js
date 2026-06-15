const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  empId:       { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  title:       { type: String, default: "" },
  dept:        { type: String, default: "" },
  deptId:      { type: String, default: "" },
  grade:       { type: String, default: "" },
  manager:     { type: String, default: "" },
  email:       { type: String, required: true, lowercase: true, trim: true },
  phone:       { type: String, default: "" },
  location:    { type: String, default: "" },
  joined:      { type: String, default: "" },
  visaExpires: { type: String, default: "" },
  eidExpires:  { type: String, default: "" },
  contract:    { type: String, enum: ["Permanent", "Probation", "Contract", "Part-time"], default: "Permanent" },
  nationality: { type: String, default: "" },
  salary:      { type: Number, default: 0 },
  leave: {
    annual: { type: Number, default: 22 },
    used:   { type: Number, default: 0 },
  },
  status: { type: String, enum: ["active", "on-leave", "inactive"], default: "active" },
  av: {
    bg: { type: String, default: "#F4DDE8" },
    fg: { type: String, default: "#6F1947" },
  },
}, { timestamps: true });

employeeSchema.index({ status: 1 });
employeeSchema.index({ dept: 1 });
employeeSchema.index({ name: 1 });

module.exports = mongoose.model("Employee", employeeSchema);

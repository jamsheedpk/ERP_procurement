const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  deptId:  { type: String, required: true, unique: true },
  name:    { type: String, required: true },
  lead:    { type: String, default: "" },
  count:   { type: Number, default: 0 },
  color:   { type: String, default: "#6F1947" },
}, { timestamps: true });

module.exports = mongoose.model("Department", departmentSchema);

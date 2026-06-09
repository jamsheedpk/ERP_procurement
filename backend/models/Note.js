const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  noteId:  { type: String, required: true, unique: true },
  empId:   { type: String, required: true },
  empName: { type: String, default: "" },
  author:  { type: String, default: "HR" },
  body:    { type: String, required: true },
  kind:    { type: String, enum: ["general", "warning", "commendation", "performance"], default: "general" },
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);

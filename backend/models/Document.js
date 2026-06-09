const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  docId:       { type: String, required: true, unique: true },
  title:       { type: String, required: true },
  category:    { type: String, enum: ["contract","policy","template","certificate","nda","letter"], required: true },
  empId:       { type: String, default: "" },
  empName:     { type: String, default: "" },
  issuedDate:  { type: String, default: "" },
  expiryDate:  { type: String, default: "" },
  status:      { type: String, enum: ["active","draft","pending_signature","expired"], default: "active" },
  fileType:    { type: String, default: "PDF" },
  fileSizeMB:  { type: Number, default: 0.5 },
  notes:       { type: String, default: "" },
  signedByEmp: { type: Boolean, default: false },
  signedByHR:  { type: Boolean, default: false },
  filePath:    { type: String, default: "" },
  fileName:    { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Document", documentSchema);

const mongoose = require("mongoose");

const cashBookSchema = new mongoose.Schema({
  entryId:     { type: String, required: true, unique: true },
  date:        { type: String, required: true },
  entryType:   { type: String, enum: ["receipt", "payment"], required: true },
  category:    { type: String, default: "" },
  reference:   { type: String, default: "" },
  description: { type: String, required: true },
  party:       { type: String, default: "" },
  projectId:   { type: String, default: "" },
  projectName: { type: String, default: "" },
  amount:      { type: Number, required: true, min: 0 },
  paymentMode: { type: String, enum: ["cash", "bank_transfer", "cheque", "mobile_pay", "other"], default: "cash" },
  notes:       { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("CashBook", cashBookSchema);

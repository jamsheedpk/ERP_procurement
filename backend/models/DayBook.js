const mongoose = require("mongoose");

const dayBookSchema = new mongoose.Schema({
  entryId:     { type: String, required: true, unique: true },
  date:        { type: String, required: true },
  entryType:   { type: String, enum: ["expense", "income", "salary", "bank_deposit", "bank_withdrawal", "transfer", "adjustment", "other"], required: true },
  account:     { type: String, required: true },
  description: { type: String, required: true },
  party:       { type: String, default: "" },
  projectId:   { type: String, default: "" },
  projectName: { type: String, default: "" },
  debit:       { type: Number, default: 0 },
  credit:      { type: Number, default: 0 },
  reference:   { type: String, default: "" },
  notes:       { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("DayBook", dayBookSchema);

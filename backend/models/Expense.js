const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  expenseId: { type: String, required: true, unique: true },
  empId:     { type: String, required: true },
  empName:   { type: String, default: "" },
  dept:      { type: String, default: "" },
  avatar:    { bg: { type: String, default: "" }, fg: { type: String, default: "" } },
  cat:       { type: String, enum: ["travel","meals","accomm","office","training","client","transport","other"], required: true },
  amount:    { type: Number, required: true, min: 0 },
  currency:  { type: String, default: "AED" },
  date:      { type: String, required: true },
  desc:      { type: String, default: "" },
  status:    { type: String, enum: ["pending","approved","reimbursed","rejected"], default: "pending" },
  paymentType: { type: String, enum: ["cash","bank_transfer","cheque","credit_card","corporate_card","mobile_pay","other"], default: "cash" },
  party:       { type: String, default: "" },
  projectId:   { type: String, default: "" },
  projectName: { type: String, default: "" },
  receipts:    { type: Number, default: 0 },
  notes:       { type: String, default: "" },
  attachments: [{
    fileName:   { type: String, default: "" },
    filePath:   { type: String, default: "" },
    fileSizeMB: { type: Number, default: 0 },
  }],
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);

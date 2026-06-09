const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema({
  sNo:        { type: Number, default: 0 },
  category:   { type: String, default: "" },
  description:{ type: String, required: true },
  unit:       { type: String, default: "lump sum" },
  qty:        { type: Number, default: 1 },
  unitPrice:  { type: Number, default: 0 },
  total:      { type: Number, default: 0 },
  notes:      { type: String, default: "" },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceId:     { type: String, required: true, unique: true },
  quotationId:   { type: String, default: "" },   // source quotation, if converted
  projectId:     { type: String, default: "" },
  projectName:   { type: String, default: "" },
  partyId:       { type: String, default: "" },
  partyName:     { type: String, default: "" },
  date:          { type: String, default: "" },   // issue date
  dueDate:       { type: String, default: "" },
  reference:     { type: String, default: "" },
  clientName:    { type: String, default: "" },
  clientAddress: { type: String, default: "" },
  clientPhone:   { type: String, default: "" },
  clientEmail:   { type: String, default: "" },
  projectTitle:  { type: String, default: "" },
  location:      { type: String, default: "" },
  introduction:  { type: String, default: "" },
  scopeOfWork:   { type: String, default: "" },
  items:         [lineItemSchema],
  subtotal:      { type: Number, default: 0 },
  discountPct:   { type: Number, default: 0 },
  discountAmt:   { type: Number, default: 0 },
  taxPct:        { type: Number, default: 5 },
  taxAmt:        { type: Number, default: 0 },
  grandTotal:    { type: Number, default: 0 },
  amountPaid:    { type: Number, default: 0 },
  balanceDue:    { type: Number, default: 0 },
  paymentTerms:  { type: String, default: "" },
  notes:         { type: String, default: "" },
  currency:      { type: String, default: "AED" },
  status:        { type: String, enum: ["unpaid","partial","paid","overdue","cancelled"], default: "unpaid" },
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);

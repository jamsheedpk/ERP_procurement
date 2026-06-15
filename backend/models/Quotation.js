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

const quotationSchema = new mongoose.Schema({
  quotationId:   { type: String, required: true, unique: true },
  projectId:     { type: String, default: "" },
  projectName:   { type: String, default: "" },
  partyId:       { type: String, default: "" },
  partyName:     { type: String, default: "" },
  projectType:   { type: String, enum: ["house","villa","office","tower","museum","mall","hotel","infrastructure","renovation","city_space","transport","park","other"], default: "other" },
  date:          { type: String, default: "" },
  validUntil:    { type: String, default: "" },
  reference:     { type: String, default: "" },
  clientName:    { type: String, default: "" },
  clientAddress: { type: String, default: "" },
  clientPhone:   { type: String, default: "" },
  clientEmail:   { type: String, default: "" },
  projectTitle:  { type: String, default: "" },
  location:      { type: String, default: "" },
  introduction:  { type: String, default: "" },
  scopeOfWork:   { type: String, default: "" },
  exclusions:    { type: String, default: "" },
  items:         [lineItemSchema],
  subtotal:      { type: Number, default: 0 },
  discountPct:   { type: Number, default: 0 },
  discountAmt:   { type: Number, default: 0 },
  taxPct:        { type: Number, default: 5 },
  taxAmt:        { type: Number, default: 0 },
  grandTotal:    { type: Number, default: 0 },
  paymentTerms:  { type: String, default: "30% advance, 40% at 50% completion, 30% on delivery" },
  deliveryTerms: { type: String, default: "" },
  validityDays:  { type: Number, default: 30 },
  currency:      { type: String, default: "AED" },
  status:        { type: String, enum: ["draft","sent","approved","rejected","expired"], default: "draft" },
  invoiceId:     { type: String, default: "" },   // set once converted to an invoice
  notes:         { type: String, default: "" },
}, { timestamps: true });

quotationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Quotation", quotationSchema);

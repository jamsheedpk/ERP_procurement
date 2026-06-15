const mongoose = require("mongoose");

/*
 * Procurement Lifecycle — 11-stage flow.
 * Each stage carries the owning DEPARTMENT, the ACTION to perform, and the
 * RESPONSIBLE role that signs the stage off. The ordered `key` list below is the
 * single source of truth for stage progression (advance = move to the next key).
 */
const PROC_STAGES = [
  { key: "enquiry",             label: "Enquiry",             department: "Project Manager",  action: "Study project scope & requirements",  responsible: "Project Manager" },
  { key: "prepare_list",        label: "Prepare List",        department: "Project Engineer", action: "Material & Labour List Preparation",  responsible: "Procurement" },
  { key: "quotation",           label: "Quotation (RFQ)",     department: "Procurement",      action: "Sourcing & Sending RFQ to Vendors",   responsible: "Procurement" },
  { key: "comparison",          label: "Comparison",          department: "Procurement",      action: "Technical & Price Comparison (Min 3)",responsible: "Project Manager" },
  { key: "approval",            label: "Approval",            department: "Project Manager",  action: "Quote Review & Final Approval",       responsible: "Procurement" },
  { key: "lpo",                 label: "LPO Issue",           department: "Procurement",      action: "Create & Send Local Purchase Order",  responsible: "Vendor" },
  { key: "proforma",            label: "Proforma Invoice",    department: "Procurement",      action: "Collect Invoice for Payment",         responsible: "Accounts" },
  { key: "payment_application", label: "Payment Application", department: "Procurement",      action: "Generate Payment Application",        responsible: "Project Manager" },
  { key: "payment_appr",        label: "Payment Approval",    department: "Project Manager",  action: "Review & Approve Payment",            responsible: "Accountant" },
  { key: "payment_release",     label: "Payment Release",     department: "Accountant",       action: "Issue Cheque / Bank Transfer",        responsible: "Procurement" },
  { key: "logistics",           label: "Logistics",           department: "Procurement",      action: "Arrange Loading & Site Delivery",     responsible: "Store / Site" },
];
const STAGE_KEYS = PROC_STAGES.map(s => s.key);

// BOQ (Bill of Quantities) cost-code line — grouped by work category.
const lineItemSchema = new mongoose.Schema({
  category:    { type: String, default: "" },   // work section e.g. Civil Works, Joinery
  description: { type: String, default: "" },
  unit:        { type: String, default: "Nos." },// LS, M², M³, LM, Nos., etc.
  qty:         { type: Number, default: 0 },
  unitPrice:   { type: Number, default: 0 },     // awarded / selected rate
  targetRate:  { type: Number, default: 0 },     // budget / target rate
  rates:       { type: [Number], default: [] },  // per-vendor rate, aligned to quoteVendors
}, { _id: false });

const quoteSchema = new mongoose.Schema({
  vendor:       { type: String, default: "" },
  amount:       { type: Number, default: 0 },
  deliveryDays: { type: Number, default: 0 },
  notes:        { type: String, default: "" },
}, { _id: false });

// step 4 — vendor columns quoted for each category (trade).
const categoryVendorSchema = new mongoose.Schema({
  category: { type: String, default: "" },
  vendors:  { type: [String], default: [] },
}, { _id: false });

// step 4 — which vendor won each category (trade) in the comparison.
const categoryAwardSchema = new mongoose.Schema({
  category: { type: String, default: "" },
  vendor:   { type: String, default: "" },
}, { _id: false });

// step 4 — the actual quotation document attached for a vendor in a category.
// One file per (category, vendor) pair — re-uploading replaces the previous one.
const quoteFileSchema = new mongoose.Schema({
  category:   { type: String, default: "" },
  vendor:     { type: String, default: "" },
  fileName:   { type: String, default: "" },
  filePath:   { type: String, default: "" },
  fileSizeMB: { type: Number, default: 0 },
  uploadedAt: { type: Date,   default: Date.now },
}, { _id: false });

// A single uploaded document (e.g. step 7 — Proforma Invoice).
const fileAttachmentSchema = new mongoose.Schema({
  fileName:   { type: String, default: "" },
  filePath:   { type: String, default: "" },
  fileSizeMB: { type: Number, default: 0 },
  uploadedAt: { type: Date,   default: Date.now },
}, { _id: false });

// step 8 — subcontractor payment application (progress / running bill).
const paymentLineSchema = new mongoose.Schema({
  category:        { type: String, default: "" },
  description:     { type: String, default: "" },
  contractSum:     { type: Number, default: 0 },
  percentComplete: { type: Number, default: 0 },
  amountValued:    { type: Number, default: 0 },
}, { _id: false });

const paymentAppSchema = new mongoose.Schema({
  appNumber:         { type: String, default: "" },
  vendor:            { type: String, default: "" },   // subcontractor
  poNumber:          { type: String, default: "" },   // referenced PO/WO
  periodEnding:      { type: String, default: "" },
  dateOfApplication: { type: String, default: "" },
  preparedBy:        { type: String, default: "" },
  workDetails:       { type: String, default: "" },
  originalContract:  { type: Number, default: 0 },
  netChanges:        { type: Number, default: 0 },
  completedToDate:   { type: Number, default: 0 },
  retainagePct:      { type: Number, default: 0 },
  lessPrevious:      { type: Number, default: 0 },
  currentDue:        { type: Number, default: 0 },
  status:            { type: String, enum: ["draft", "submitted", "certified"], default: "draft" },
  lines: [paymentLineSchema],
}, { _id: false });

// step 6 — one Local Purchase Order per awarded vendor.
const purchaseOrderSchema = new mongoose.Schema({
  poNumber:   { type: String, default: "" },
  vendor:     { type: String, default: "" },
  date:       { type: String, default: "" },
  categories: { type: [String], default: [] },  // categories covered by this PO
  amount:     { type: Number, default: 0 },      // subtotal (ex-VAT)
  vat:        { type: Number, default: 0 },
  total:      { type: Number, default: 0 },
  status:     { type: String, enum: ["draft", "issued"], default: "draft" },
}, { _id: false });

const historySchema = new mongoose.Schema({
  stage:  { type: String, default: "" },   // stage key that was completed
  label:  { type: String, default: "" },   // human label snapshot
  action: { type: String, default: "" },   // action snapshot
  by:     { type: String, default: "" },   // who signed it off
  note:   { type: String, default: "" },
  at:     { type: Date,   default: Date.now },
}, { _id: false });

const procurementSchema = new mongoose.Schema({
  procId:       { type: String, required: true, unique: true },
  title:        { type: String, required: true },
  description:  { type: String, default: "" },
  department:   { type: String, default: "" },           // requesting department
  projectId:    { type: String, default: "" },
  projectName:  { type: String, default: "" },
  vendor:       { type: String, default: "" },           // selected / preferred vendor
  raisedBy:     { type: String, default: "" },
  priority:     { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
  estValue:     { type: Number, default: 0 },

  // Customer quotation linked from the originating Project (snapshot).
  quotationRef:    { type: String, default: "" },
  quotationDate:   { type: String, default: "" },
  quotationAmount: { type: Number, default: 0 },

  currentStage: { type: String, enum: STAGE_KEYS, default: "enquiry" },
  status:       { type: String, enum: ["in_progress", "completed", "on_hold", "cancelled"], default: "in_progress" },

  items:  [lineItemSchema],   // step 2 — Material & Labour list (BOQ)
  quoteVendors:    { type: [String], default: [] },  // legacy shared vendor columns
  categoryVendors: [categoryVendorSchema],           // step 4 — vendor columns per category
  categoryAwards:  [categoryAwardSchema],            // step 4 — winner per category
  quoteFiles:      [quoteFileSchema],                // step 4 — attached vendor quote docs
  quotes: [quoteSchema],      // legacy single-amount quotes (kept for back-compat)

  // Stage-specific captured values
  purchaseOrders:     [purchaseOrderSchema],       // step 6 — one PO per awarded vendor
  paymentApplications:[paymentAppSchema],          // step 8 — payment application per vendor
  poNumber:       { type: String, default: "" },   // legacy single-PO fields
  poDate:         { type: String, default: "" },
  poAmount:       { type: Number, default: 0 },
  invoiceNumber:  { type: String, default: "" },   // step 7 — Proforma / invoice
  invoiceAmount:  { type: Number, default: 0 },
  proformaFile:   { type: fileAttachmentSchema, default: null },  // step 7 — attached proforma invoice doc
  paymentMethod:  { type: String, default: "" },   // step 10 — Payment release
  paymentRef:     { type: String, default: "" },
  paymentAmount:  { type: Number, default: 0 },
  paymentDate:    { type: String, default: "" },
  deliveryNote:   { type: String, default: "" },   // step 11 — Logistics
  deliveredTo:    { type: String, default: "" },
  deliveryDate:   { type: String, default: "" },

  history: [historySchema],
}, { timestamps: true });

procurementSchema.index({ status: 1, createdAt: -1 });
procurementSchema.index({ currentStage: 1 });

module.exports = mongoose.model("Procurement", procurementSchema);
module.exports.PROC_STAGES = PROC_STAGES;
module.exports.STAGE_KEYS  = STAGE_KEYS;

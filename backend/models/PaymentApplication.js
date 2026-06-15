const mongoose = require("mongoose");

const lineSchema = new mongoose.Schema({
  sNo:             { type: Number,  default: 0 },
  category:        { type: String,  default: "" },
  description:     { type: String,  default: "" },
  contractSum:     { type: Number,  default: 0 },
  previousPct:     { type: Number,  default: 0 },
  previousAmt:     { type: Number,  default: 0 },
  currentPct:      { type: Number,  default: 0 },
  currentAmt:      { type: Number,  default: 0 },
  cumulativePct:   { type: Number,  default: 0 },
  cumulativeAmt:   { type: Number,  default: 0 },
}, { _id: false });

const paymentApplicationSchema = new mongoose.Schema({
  appId:             { type: String, required: true, unique: true },
  procId:            { type: String, default: "" },   // referenced procurement record
  projectId:         { type: String, default: "" },
  projectName:       { type: String, default: "" },
  vendor:            { type: String, default: "" },   // subcontractor name
  poNumber:          { type: String, default: "" },   // referenced PO
  appNumber:         { type: String, default: "" },   // e.g. "PA-001", "PA-002"
  dateOfApplication: { type: String, default: "" },
  periodFrom:        { type: String, default: "" },
  periodTo:          { type: String, default: "" },
  preparedBy:        { type: String, default: "" },
  certifiedBy:       { type: String, default: "" },
  originalContract:  { type: Number, default: 0 },
  netChanges:        { type: Number, default: 0 },
  revisedContract:   { type: Number, default: 0 },
  completedToDate:   { type: Number, default: 0 },
  previousClaimed:   { type: Number, default: 0 },
  currentClaim:      { type: Number, default: 0 },
  retainagePct:      { type: Number, default: 10 },
  retainageAmt:      { type: Number, default: 0 },
  netCurrentDue:     { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["draft", "submitted", "certified", "paid"],
    default: "draft",
  },
  lines: [lineSchema],
}, { timestamps: true });

module.exports = mongoose.model("PaymentApplication", paymentApplicationSchema);

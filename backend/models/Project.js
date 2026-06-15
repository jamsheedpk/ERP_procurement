const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema({
  date:    { type: String, default: "" },
  notes:   { type: String, default: "" },
  outcome: { type: String, default: "" },
  by:      { type: String, default: "" },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  projectId:          { type: String, required: true, unique: true },
  title:              { type: String, required: true },
  partyId:            { type: String, default: "" },
  partyName:          { type: String, default: "" },
  type:               { type: String, enum: ["house","villa","office","tower","museum","mall","hotel","infrastructure","renovation","other"], required: true },
  location:           { type: String, default: "" },
  lat:                { type: Number, default: null },
  lng:                { type: Number, default: null },
  stage:              { type: String, enum: ["quotation","discussion","approved","advance_collected","work_started","completed","on_hold","cancelled"], default: "quotation" },
  priority:           { type: String, enum: ["low","medium","high","urgent"], default: "medium" },
  description:        { type: String, default: "" },
  assignedTo:         { type: String, default: "" },
  quotationRef:       { type: String, default: "" },
  quotationDate:      { type: String, default: "" },
  quotationAmount:    { type: Number, default: 0 },
  discussions:        [discussionSchema],
  approvedDate:       { type: String, default: "" },
  approvedAmount:     { type: Number, default: 0 },
  approvedBy:         { type: String, default: "" },
  contractRef:        { type: String, default: "" },
  advanceAmount:      { type: Number, default: 0 },
  advanceDate:        { type: String, default: "" },
  advanceRef:         { type: String, default: "" },
  advanceMode:        { type: String, default: "cash" },
  workStartDate:      { type: String, default: "" },
  expectedCompletion: { type: String, default: "" },
  siteEngineer:       { type: String, default: "" },
  completionDate:     { type: String, default: "" },
  finalAmount:        { type: Number, default: 0 },
  notes:              { type: String, default: "" },
}, { timestamps: true });

projectSchema.index({ stage: 1, createdAt: -1 });
projectSchema.index({ assignedTo: 1 });

module.exports = mongoose.model("Project", projectSchema);

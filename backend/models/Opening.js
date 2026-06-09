const mongoose = require("mongoose");

const openingSchema = new mongoose.Schema({
  jobId:      { type: String, required: true, unique: true },
  role:       { type: String, required: true },
  dept:       { type: String, default: "" },
  type:       { type: String, default: "Full-time" },
  location:   { type: String, default: "" },
  posted:     { type: String, default: "" },
  applicants: { type: Number, default: 0 },
  stage: {
    applied:   { type: Number, default: 0 },
    screen:    { type: Number, default: 0 },
    interview: { type: Number, default: 0 },
    offer:     { type: Number, default: 0 },
    hired:     { type: Number, default: 0 },
  },
  status: { type: String, enum: ["open", "closed", "paused"], default: "open" },
}, { timestamps: true });

module.exports = mongoose.model("Opening", openingSchema);

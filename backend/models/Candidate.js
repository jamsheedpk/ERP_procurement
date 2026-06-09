const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  candidateId: { type: String, required: true, unique: true },
  jobId:       { type: String, required: true },
  role:        { type: String, default: "" },
  name:        { type: String, required: true },
  stage:       { type: String, enum: ["applied", "screen", "interview", "offer", "hired", "rejected"], default: "applied" },
  email:       { type: String, lowercase: true, trim: true, default: "" },
  location:    { type: String, default: "" },
  exp:         { type: Number, default: 0 },
  source:      { type: String, default: "" },
  applied:     { type: String, default: "" },
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  av: {
    bg: { type: String, default: "#FBE2EC" },
    fg: { type: String, default: "#6F1947" },
  },
  tags: [{ type: String }],
  notes: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Candidate", candidateSchema);

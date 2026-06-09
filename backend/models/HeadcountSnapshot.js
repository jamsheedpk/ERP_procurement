const mongoose = require("mongoose");

const headcountSnapshotSchema = new mongoose.Schema({
  m: { type: String, required: true }, // e.g. "Jun '25"
  v: { type: Number, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("HeadcountSnapshot", headcountSnapshotSchema);

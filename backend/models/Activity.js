const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  when: { type: String, default: "" },
  who:  { type: String, default: "" },
  what: { type: String, required: true },
  icon: { type: String, default: "info" },
  kind: { type: String, enum: ["succ", "info", "warn", "brand", "danger"], default: "info" },
}, { timestamps: true });

module.exports = mongoose.model("Activity", activitySchema);

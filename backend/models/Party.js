const mongoose = require("mongoose");

const partySchema = new mongoose.Schema({
  partyId:       { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  type:          { type: String, enum: ["vendor","client","employee","bank","government","other"], required: true },
  contactPerson: { type: String, default: "" },
  phone:         { type: String, default: "" },
  email:         { type: String, default: "" },
  address:       { type: String, default: "" },
  bankName:      { type: String, default: "" },
  bankAccount:   { type: String, default: "" },
  bankIBAN:      { type: String, default: "" },
  taxNumber:     { type: String, default: "" },
  notes:         { type: String, default: "" },
  status:        { type: String, enum: ["active","inactive"], default: "active" },
}, { timestamps: true });

module.exports = mongoose.model("Party", partySchema);

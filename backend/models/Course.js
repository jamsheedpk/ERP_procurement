const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseId:        { type: String, required: true, unique: true },
  title:           { type: String, required: true },
  cat:             { type: String, enum: ["technical","leadership","compliance","soft","safety","product"], required: true },
  status:          { type: String, enum: ["active","upcoming","completed","mandatory"], default: "active" },
  duration:        { type: String, default: "" },
  provider:        { type: String, default: "" },
  dueDate:         { type: String, default: "" },
  desc:            { type: String, default: "" },
  enrolledEmpIds:  { type: [String], default: [] },
  completedEmpIds: { type: [String], default: [] },
}, { timestamps: true });

courseSchema.virtual("enrolledCount").get(function() { return this.enrolledEmpIds.length; });
courseSchema.virtual("completedCount").get(function() { return this.completedEmpIds.length; });
courseSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Course", courseSchema);

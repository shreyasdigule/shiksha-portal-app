const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true }],
    durationMinutes: { type: Number, required: true, min: 1 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    negativeMarking: { type: Boolean, default: false },
    negativeMarkValue: { type: Number, default: 0.25 },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

testSchema.pre("validate", function (next) {
  if (this.endTime <= this.startTime) {
    this.invalidate("endTime", "endTime must be after startTime");
  }
  next();
});

testSchema.virtual("totalMarks").get(function () {
  return this.questions.length;
});

module.exports = mongoose.model("Test", testSchema);

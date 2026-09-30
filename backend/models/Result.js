const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    selectedOptionIndex: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const flagEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["tab_switch", "fullscreen_exit", "blur"] },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    answers: [answerSchema],
    flagEvents: [flagEventSchema],
    status: { type: String, enum: ["completed", "auto_submitted"], default: "completed" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, test: 1 }, { unique: true });

module.exports = mongoose.model("Result", resultSchema);

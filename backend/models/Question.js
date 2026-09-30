const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: { validator: (v) => v.length === 4, message: "Exactly 4 options required" },
    },
    correctOptionIndex: { type: Number, required: true, min: 0, max: 3 },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, trim: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);

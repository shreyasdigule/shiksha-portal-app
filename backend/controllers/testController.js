const Test = require("../models/Test");
const Question = require("../models/Question");
const Result = require("../models/Result");

exports.createTest = async (req, res, next) => {
  try {
    const { title, subject, questions, durationMinutes, startTime, endTime, negativeMarking, negativeMarkValue } = req.body;
    if (!title || !subject || !questions || !durationMinutes || !startTime || !endTime) {
      return res.status(400).json({ message: "title, subject, questions, durationMinutes, startTime, and endTime are required" });
    }
    // Verify questions belong to this teacher
    const owned = await Question.find({ _id: { $in: questions }, createdBy: req.user._id });
    if (owned.length !== questions.length) {
      return res.status(403).json({ message: "Some questions do not belong to you" });
    }
    const test = await Test.create({
      title, subject, questions, durationMinutes, startTime, endTime,
      negativeMarking, negativeMarkValue, createdBy: req.user._id,
    });
    res.status(201).json(test);
  } catch (err) {
    next(err);
  }
};

exports.publishTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });
    if (test.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your test" });
    }
    test.isPublished = true;
    await test.save();
    res.json(test);
  } catch (err) {
    next(err);
  }
};

exports.getMyTests = async (req, res, next) => {
  try {
    const tests = await Test.find({ createdBy: req.user._id })
      .populate("questions", "questionText subject difficulty")
      .sort({ createdAt: -1 });
    res.json(tests);
  } catch (err) {
    next(err);
  }
};

exports.getAvailableTests = async (req, res, next) => {
  try {
    const now = new Date();
    // Find tests student already attempted
    const attempted = await Result.find({ student: req.user._id }).distinct("test");
    const tests = await Test.find({
      isPublished: true,
      endTime: { $gt: now },
      _id: { $nin: attempted },
    }).select("-questions.correctOptionIndex").sort({ startTime: 1 });
    res.json(tests);
  } catch (err) {
    next(err);
  }
};

exports.getTestForAttempt = async (req, res, next) => {
  try {
    const now = new Date();
    // Check if already attempted
    const existing = await Result.findOne({ student: req.user._id, test: req.params.id });
    if (existing) return res.status(409).json({ message: "You have already attempted this test" });

    const test = await Test.findById(req.params.id)
      .populate("questions", "-correctOptionIndex"); // hide correct answers
    if (!test) return res.status(404).json({ message: "Test not found" });
    if (!test.isPublished || test.endTime < now) {
      return res.status(403).json({ message: "Test is not available" });
    }
    res.json(test);
  } catch (err) {
    next(err);
  }
};

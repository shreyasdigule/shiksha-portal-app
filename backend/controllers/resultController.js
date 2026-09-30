const Result = require("../models/Result");
const Test = require("../models/Test");
const Question = require("../models/Question");

exports.submitTest = async (req, res, next) => {
  try {
    const { testId, answers, flagEvents } = req.body;

    const duplicate = await Result.findOne({ student: req.user._id, test: testId });
    if (duplicate) return res.status(409).json({ message: "You have already submitted this test" });

    const test = await Test.findById(testId).populate("questions");
    if (!test) return res.status(404).json({ message: "Test not found" });

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const processedAnswers = test.questions.map((q) => {
      const submitted = (answers || []).find((a) => a.questionId === q._id.toString());
      const selectedIndex = submitted ? submitted.selectedOptionIndex : null;

      if (selectedIndex === null || selectedIndex === undefined) {
        skippedCount++;
        return { question: q._id, selectedOptionIndex: null, isCorrect: false };
      }
      if (selectedIndex === q.correctOptionIndex) {
        correctCount++;
        score += 1;
        return { question: q._id, selectedOptionIndex: selectedIndex, isCorrect: true };
      } else {
        incorrectCount++;
        if (test.negativeMarking) {
          score -= test.negativeMarkValue || 0.25;
        }
        return { question: q._id, selectedOptionIndex: selectedIndex, isCorrect: false };
      }
    });

    // Floor at 0 — grace for late network submits
    score = Math.max(0, score);

    const result = await Result.create({
      student: req.user._id,
      test: testId,
      score,
      totalMarks: test.questions.length,
      correctCount,
      incorrectCount,
      skippedCount,
      answers: processedAnswers,
      flagEvents: flagEvents || [],
      status: "completed",
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getMyResults = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate("test", "title subject durationMinutes")
      .sort({ submittedAt: -1 });
    res.json(results);
  } catch (err) {
    next(err);
  }
};

exports.getResultDetail = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate("student", "name email studentId")
      .populate({ path: "test", populate: { path: "questions" } });
    if (!result) return res.status(404).json({ message: "Result not found" });

    // Access check: owner student or teacher who created the test
    const isOwner = result.student._id.toString() === req.user._id.toString();
    const isTeacher = req.user.role === "teacher" && result.test.createdBy.toString() === req.user._id.toString();
    if (!isOwner && !isTeacher) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getTestResults = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) return res.status(404).json({ message: "Test not found" });
    if (test.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const results = await Result.find({ test: req.params.testId })
      .populate("student", "name email studentId department");

    const scores = results.map((r) => r.score);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const flaggedAttempts = results.filter((r) => r.flagEvents && r.flagEvents.length > 0);

    res.json({
      results,
      stats: {
        total: results.length,
        averageScore: Math.round(avg * 100) / 100,
        highest: scores.length ? Math.max(...scores) : 0,
        lowest: scores.length ? Math.min(...scores) : 0,
        flaggedAttempts: flaggedAttempts.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

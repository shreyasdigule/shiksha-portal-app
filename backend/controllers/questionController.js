const Question = require("../models/Question");

exports.createQuestion = async (req, res, next) => {
  try {
    const { questionText, options, correctOptionIndex, subject, topic, difficulty } = req.body;
    if (!questionText || !options || correctOptionIndex === undefined || !subject) {
      return res.status(400).json({ message: "questionText, options, correctOptionIndex, and subject are required" });
    }
    const question = await Question.create({
      questionText, options, correctOptionIndex, subject, topic, difficulty,
      createdBy: req.user._id,
    });
    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
};

exports.createQuestionsBulk = async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "questions array is required" });
    }
    const docs = questions.map((q) => ({ ...q, createdBy: req.user._id }));
    const created = await Question.insertMany(docs);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.getQuestions = async (req, res, next) => {
  try {
    const filter = { createdBy: req.user._id };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.topic) filter.topic = req.query.topic;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    next(err);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found" });
    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not owned by you" });
    }
    await question.deleteOne();
    res.json({ message: "Question deleted" });
  } catch (err) {
    next(err);
  }
};

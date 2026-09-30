const express = require("express");
const router = express.Router();
const { createQuestion, createQuestionsBulk, getQuestions, deleteQuestion } = require("../controllers/questionController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("teacher"));

router.post("/", createQuestion);
router.post("/bulk", createQuestionsBulk);
router.get("/", getQuestions);
router.delete("/:id", deleteQuestion);

module.exports = router;

const express = require("express");
const router = express.Router();
const { submitTest, getMyResults, getResultDetail, getTestResults } = require("../controllers/resultController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/submit", authorize("student"), submitTest);
router.get("/mine", authorize("student"), getMyResults);
router.get("/test/:testId", authorize("teacher"), getTestResults);
router.get("/:id", getResultDetail); // access check inside controller

module.exports = router;

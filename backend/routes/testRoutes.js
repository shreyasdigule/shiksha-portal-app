const express = require("express");
const router = express.Router();
const { createTest, publishTest, getMyTests, getAvailableTests, getTestForAttempt } = require("../controllers/testController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

// Teacher routes
router.post("/", authorize("teacher"), createTest);
router.patch("/:id/publish", authorize("teacher"), publishTest);
router.get("/mine", authorize("teacher"), getMyTests);

// Student routes
router.get("/available", authorize("student"), getAvailableTests);
router.get("/:id/attempt", authorize("student"), getTestForAttempt);

module.exports = router;

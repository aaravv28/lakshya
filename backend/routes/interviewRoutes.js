const express = require("express");
const router = express.Router();

const {
    getInterviews,
    getInterviewById,
    createInterview,
    updateInterview,
    deleteInterview,
    getInterviewsByApplication
} = require("../controllers/interviewController");
const { authorize } = require("../middleware/authMiddleware");

router.get("/", getInterviews);
router.get("/application/:applicationId", getInterviewsByApplication);
router.get("/:interviewId", getInterviewById);
router.post("/", authorize("recruiter", "officer"), createInterview);
router.put("/:interviewId", authorize("recruiter", "officer"), updateInterview);
router.delete("/:interviewId", authorize("recruiter", "officer"), deleteInterview);

module.exports = router;

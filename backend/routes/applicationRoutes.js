const express = require("express");
const router = express.Router();

const {
    getApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication,
    getApplicationsByStudent,
    getApplicationsByJob
} = require("../controllers/applicationController");
const { authorize } = require("../middleware/authMiddleware");

router.get("/", getApplications);
router.get("/student/:studentId", getApplicationsByStudent);
router.get("/job/:jobId", getApplicationsByJob);
router.get("/:applicationId", getApplicationById);
router.post("/", authorize("student"), createApplication);
router.put("/:applicationId", authorize("recruiter", "officer"), updateApplication);
router.delete("/:applicationId", authorize("student", "recruiter", "officer"), deleteApplication);

module.exports = router;

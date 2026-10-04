const express = require("express");
const router = express.Router();

const {
    getJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    getJobsByCompany,
    checkJobEligibility
} = require("../controllers/jobController");
const { authorize } = require("../middleware/authMiddleware");

router.get("/", getJobs);
router.get("/company/:companyId", getJobsByCompany);
router.get("/eligibility/:studentId/:jobId", checkJobEligibility);
router.get("/:jobId", getJobById);
router.post("/", authorize("recruiter"), createJob);
router.put("/:jobId", authorize("recruiter"), updateJob);
router.delete("/:jobId", authorize("recruiter"), deleteJob);

module.exports = router;

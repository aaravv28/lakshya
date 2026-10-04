const express = require("express");
const router = express.Router();

const {
    getMyRegistration,
    updateMyRegistration,
    submitMyRegistration,
    listPendingRegistrations,
    getRegistration,
    approveRegistration,
    rejectRegistration
} = require("../controllers/registrationController");
const { authorize } = require("../middleware/authMiddleware");

// The logged-in recruiter's own company registration
router.get("/", authorize("recruiter"), getMyRegistration);
router.put("/", authorize("recruiter"), updateMyRegistration);
router.post("/submit", authorize("recruiter"), submitMyRegistration);

// The placement officer's review
router.get("/pending", authorize("officer"), listPendingRegistrations);
router.get("/:recruiterId", authorize("officer"), getRegistration);
router.post("/:recruiterId/approve", authorize("officer"), approveRegistration);
router.post("/:recruiterId/reject", authorize("officer"), rejectRegistration);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
    getResumes,
    getResumeById,
    getMyResume,
    viewResume,
    createResume,
    updateResume,
    deleteResume
} = require("../controllers/resumeController");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const { upload } = require("../config/multer");

router.get("/", authenticate, authorize("student", "officer", "recruiter"), getResumes);
router.get("/me", authenticate, authorize("student"), getMyResume);
router.get("/:resumeId/view", authenticate, viewResume);
router.get("/:resumeId", authenticate, getResumeById);
router.post("/", authenticate, authorize("student"), upload.single("resume"), createResume);
router.put("/:resumeId", authenticate, authorize("student"), upload.single("resume"), updateResume);
router.delete("/:resumeId", authenticate, authorize("student"), deleteResume);

module.exports = router;

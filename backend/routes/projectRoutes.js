const express = require("express");
const router = express.Router();

const {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectsByStudent
} = require("../controllers/projectController");
const { authorize } = require("../middleware/authMiddleware");

router.get("/", getProjects);
router.get("/student/:studentId", getProjectsByStudent);
router.get("/:projectId", getProjectById);
router.post("/", authorize("student"), createProject);
router.put("/:projectId", authorize("student"), updateProject);
router.delete("/:projectId", authorize("student"), deleteProject);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    setPassword,
    deleteStudent
} = require("../controllers/studentController");
const { authorize, authorizeSelfOrRoles } = require("../middleware/authMiddleware");

router.get("/", getStudents);
router.get("/:enrollmentNo", getStudentById);
router.post("/", authorize("officer"), createStudent);
router.put("/:enrollmentNo/password", authorizeSelfOrRoles("enrollmentNo", "officer"), setPassword);
router.put("/:enrollmentNo", authorizeSelfOrRoles("enrollmentNo", "officer"), updateStudent);
router.delete("/:enrollmentNo", authorize("officer"), deleteStudent);

module.exports = router;
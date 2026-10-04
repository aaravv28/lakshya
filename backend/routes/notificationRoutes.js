const express = require("express");
const router = express.Router();

const {
    getNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    getNotificationsByStudent
} = require("../controllers/notificationController");
const { authorize } = require("../middleware/authMiddleware");

router.get("/", getNotifications);
router.get("/student/:studentId", getNotificationsByStudent);
router.get("/:notificationId", getNotificationById);
router.post("/", authorize("officer"), createNotification);
router.put("/:notificationId", authorize("student", "officer"), updateNotification);
router.delete("/:notificationId", authorize("officer"), deleteNotification);

module.exports = router;

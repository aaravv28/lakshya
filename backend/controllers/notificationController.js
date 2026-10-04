const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find();
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findOne({ notificationId: req.params.notificationId });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createNotification = async (req, res) => {
    try {
        const notification = new Notification(req.body);
        const savedNotification = await notification.save();
        res.status(201).json(savedNotification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { notificationId: req.params.notificationId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ notificationId: req.params.notificationId });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getNotificationsByStudent = async (req, res) => {
    try {
        const notifications = await Notification.find({ studentId: req.params.studentId });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    getNotificationsByStudent
};

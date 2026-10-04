const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    notificationId: {
        type: String,
        required: true,
        unique: true
    },

    studentId: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    notificationType: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    isRead: {
        type: Boolean,
        required: true
    }
});

module.exports = mongoose.model("Notification", notificationSchema);

const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
    resumeId: {
        type: String,
        required: true,
        unique: true
    },

    studentId: {
        type: String,
        required: true
    },

    fileUrl: {
        type: String,
        required: true
    },

    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Resume", resumeSchema);

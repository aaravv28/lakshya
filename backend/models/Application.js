const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
    applicationId: {
        type: String,
        required: true,
        unique: true
    },

    studentId: {
        type: String,
        required: true
    },

    jobId: {
        type: String,
        required: true
    },

    recruiterId: {
        type: String,
        required: true
    },

    appliedDate: {
        type: Date,
        default: Date.now
    },

    applicationStatus: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Application", applicationSchema);

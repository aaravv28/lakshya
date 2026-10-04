const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true
    },

    companyId: {
        type: String,
        required: true
    },

    approvedByOfficerId: {
        type: String
    },

    jobTitle: {
        type: String,
        required: true
    },

    jobDescription: {
        type: String,
        required: true
    },

    jobType: {
        type: String,
        required: true
    },

    package: {
        type: Number,
        required: true
    },

    deadline: {
        type: Date,
        required: true
    },

    minCgpa: {
        type: Number,
        required: true
    },

    maxBacklogs: {
        type: Number,
        required: true
    },

    allowedDepartments: {
        type: [String],
        required: true
    },

    jobStatus: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Job", jobSchema);

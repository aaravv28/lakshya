const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
    interviewId: {
        type: String,
        required: true,
        unique: true
    },

    applicationId: {
        type: String,
        required: true
    },

    interviewDate: {
        type: Date,
        required: true
    },

    interviewTime: {
        type: String,
        required: true
    },

    interviewMode: {
        type: String,
        required: true
    },

    interviewRound: {
        type: String,
        required: true
    },

    interviewStatus: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Interview", interviewSchema);

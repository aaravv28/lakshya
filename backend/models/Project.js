const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    projectId: {
        type: String,
        required: true,
        unique: true
    },

    studentId: {
        type: String,
        required: true
    },

    projectTitle: {
        type: String,
        required: true
    },

    projectDescription: {
        type: String,
        required: true
    },

    technologies: {
        type: [String],
        default: []
    },

    projectUrl: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Project", projectSchema);

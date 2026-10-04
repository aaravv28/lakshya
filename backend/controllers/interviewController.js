const Interview = require("../models/Interview");

const getInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find();
        res.status(200).json(interviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getInterviewById = async (req, res) => {
    try {
        const interview = await Interview.findOne({ interviewId: req.params.interviewId });

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        res.status(200).json(interview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createInterview = async (req, res) => {
    try {
        const interview = new Interview(req.body);
        const savedInterview = await interview.save();
        res.status(201).json(savedInterview);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateInterview = async (req, res) => {
    try {
        const interview = await Interview.findOneAndUpdate(
            { interviewId: req.params.interviewId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        res.status(200).json(interview);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteInterview = async (req, res) => {
    try {
        const interview = await Interview.findOneAndDelete({ interviewId: req.params.interviewId });

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        res.status(200).json({ message: "Interview deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getInterviewsByApplication = async (req, res) => {
    try {
        const interviews = await Interview.find({ applicationId: req.params.applicationId });
        res.status(200).json(interviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getInterviews,
    getInterviewById,
    createInterview,
    updateInterview,
    deleteInterview,
    getInterviewsByApplication
};

const Application = require("../models/Application");
const Job = require("../models/Job");
const { canSeeCompany } = require("../utils/visibility");

const getApplications = async (req, res) => {
    try {
        const applications = await Application.find();
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getApplicationById = async (req, res) => {
    try {
        const application = await Application.findOne({ applicationId: req.params.applicationId });

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        res.status(200).json(application);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createApplication = async (req, res) => {
    try {
        const job = await Job.findOne({ jobId: req.body.jobId });
        if (!job || !await canSeeCompany(req.user, job.companyId)) {
            return res.status(404).json({ message: "Job not found" });
        }
        // A deadline is a date: applications stay open until the end of that day.
        const closesAt = new Date(job.deadline.getTime() + 24 * 60 * 60 * 1000);
        if (closesAt <= new Date()) {
            return res.status(400).json({ message: "The application deadline for this job has passed" });
        }

        const application = new Application(req.body);
        const savedApplication = await application.save();
        res.status(201).json(savedApplication);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateApplication = async (req, res) => {
    try {
        const application = await Application.findOneAndUpdate(
            { applicationId: req.params.applicationId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        res.status(200).json(application);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteApplication = async (req, res) => {
    try {
        const application = await Application.findOneAndDelete({ applicationId: req.params.applicationId });

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        res.status(200).json({ message: "Application deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getApplicationsByStudent = async (req, res) => {
    try {
        const applications = await Application.find({ studentId: req.params.studentId });
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getApplicationsByJob = async (req, res) => {
    try {
        const applications = await Application.find({ jobId: req.params.jobId });
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication,
    getApplicationsByStudent,
    getApplicationsByJob
};

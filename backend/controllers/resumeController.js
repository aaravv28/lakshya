const fs = require("fs");
const path = require("path");
const Resume = require("../models/Resume");
const { safeDeleteLocalResumeFile } = require("../config/multer");

const getResumeFileNameFromUrl = (fileUrl) => {
    if (!fileUrl || typeof fileUrl !== "string") {
        return null;
    }

    try {
        const url = new URL(fileUrl, "http://localhost");
        return path.basename(url.pathname);
    } catch (error) {
        return path.basename(fileUrl);
    }
};

const hasPermissionToViewResume = (user, resume) => {
    if (!user || !resume) {
        return false;
    }

    if (user.role === "student") {
        return resume.studentId === user.id;
    }

    return ["recruiter", "officer"].includes(user.role);
};

const getResumes = async (req, res) => {
    try {
        const resumes = await Resume.find();
        res.status(200).json(resumes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getResumeById = async (req, res) => {
    try {
        const resume = await Resume.findOne({ resumeId: req.params.resumeId });

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        if (!hasPermissionToViewResume(req.user, resume)) {
            return res.status(403).json({ message: "You are not authorized to view this resume" });
        }

        res.status(200).json(resume);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyResume = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can access their own resume" });
        }

        const resume = await Resume.findOne({ studentId: req.user.id });

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        return res.status(200).json(resume);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const viewResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ resumeId: req.params.resumeId });

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        if (!hasPermissionToViewResume(req.user, resume)) {
            return res.status(403).json({ message: "You are not authorized to view this resume" });
        }

        if (resume.fileUrl && /^https?:\/\//i.test(resume.fileUrl)) {
            return res.redirect(resume.fileUrl);
        }

        if (resume.fileUrl && resume.fileUrl.startsWith("/uploads/resumes/")) {
            const safePath = path.resolve(__dirname, "..", resume.fileUrl.replace(/^\/+/, ""));
            return res.download(safePath, path.basename(resume.fileUrl));
        }

        return res.status(404).json({ message: "Resume file is unavailable" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createResume = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can upload resumes" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Resume PDF is required" });
        }

        const existingResume = await Resume.findOne({ studentId: req.user.id });

        if (existingResume) {
            const previousStoredName = getResumeFileNameFromUrl(existingResume.fileUrl);
            const previousUrl = existingResume.fileUrl;
            const nextUrl = `/uploads/resumes/${req.file.filename}`;

            if (previousUrl && previousUrl.startsWith("/uploads/resumes/")) {
                safeDeleteLocalResumeFile(previousStoredName);
            }

            existingResume.fileUrl = nextUrl;
            existingResume.uploadedAt = new Date();
            const updatedResume = await existingResume.save();
            return res.status(200).json(updatedResume);
        }

        const resume = new Resume({
            resumeId: `RES-${Date.now()}`,
            studentId: req.user.id,
            fileUrl: `/uploads/resumes/${req.file.filename}`,
            uploadedAt: new Date()
        });

        const savedResume = await resume.save();
        res.status(201).json(savedResume);
    } catch (error) {
        if (req.file) {
            safeDeleteLocalResumeFile(req.file.filename);
        }
        res.status(400).json({ message: error.message });
    }
};

const updateResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ resumeId: req.params.resumeId });

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        if (!req.user || req.user.role !== "student" || resume.studentId !== req.user.id) {
            return res.status(403).json({ message: "You can only update your own resume" });
        }

        if (!req.file && !req.body?.fileUrl) {
            return res.status(400).json({ message: "Resume PDF or fileUrl is required" });
        }

        if (req.file) {
            const previousStoredName = getResumeFileNameFromUrl(resume.fileUrl);
            if (resume.fileUrl && resume.fileUrl.startsWith("/uploads/resumes/")) {
                safeDeleteLocalResumeFile(previousStoredName);
            }
            resume.fileUrl = `/uploads/resumes/${req.file.filename}`;
            resume.uploadedAt = new Date();
        } else if (req.body.fileUrl) {
            resume.fileUrl = req.body.fileUrl;
        }

        Object.keys(req.body || {}).forEach((key) => {
            if (key !== "fileUrl" && key !== "resumeId" && key !== "studentId" && key !== "uploadedAt") {
                resume[key] = req.body[key];
            }
        });

        const updatedResume = await resume.save();
        res.status(200).json(updatedResume);
    } catch (error) {
        if (req.file) {
            safeDeleteLocalResumeFile(req.file.filename);
        }
        res.status(400).json({ message: error.message });
    }
};

const deleteResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ resumeId: req.params.resumeId });

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        if (!req.user || req.user.role !== "student" || resume.studentId !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own resume" });
        }

        if (resume.fileUrl && resume.fileUrl.startsWith("/uploads/resumes/")) {
            const storedName = getResumeFileNameFromUrl(resume.fileUrl);
            safeDeleteLocalResumeFile(storedName);
        }

        await Resume.deleteOne({ _id: resume._id });
        res.status(200).json({ message: "Resume deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getResumes,
    getResumeById,
    getMyResume,
    viewResume,
    createResume,
    updateResume,
    deleteResume
};

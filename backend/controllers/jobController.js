const Job = require("../models/Job");
const Student = require("../models/Student");
const Recruiter = require("../models/Recruiter");
const { newId } = require("../utils/ids");
const { listableCompanyIds, canSeeCompany } = require("../utils/visibility");
const { canAddJob, canEditRegistration, jobLockedMessage } = require("../utils/registrationRules");

const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ companyId: { $in: await listableCompanyIds(req.user) } });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getJobById = async (req, res) => {
    try {
        const job = await Job.findOne({ jobId: req.params.jobId });

        if (!job || !await canSeeCompany(req.user, job.companyId)) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.status(200).json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fields a recruiter can never set on a job: the server decides which company it belongs to and who approved it.
const withoutServerFields = ({ jobId, companyId, approvedByOfficerId, ...rest }) => rest;

const findRecruiter = (recruiterId) => Recruiter.findOne({ recruiterId }, "companyId registrationStatus officerId");

// Jobs are created and changed only by recruiters, only for their own company, and only while their
// company registration is still editable. Sends the refusal and returns null otherwise.
const findChangeableJob = async (req, res) => {
    const job = await Job.findOne({ jobId: req.params.jobId });
    if (!job) {
        res.status(404).json({ message: "Job not found" });
        return null;
    }
    const recruiter = await findRecruiter(req.user.id);
    if (job.companyId !== recruiter?.companyId) {
        res.status(403).json({ message: "You can only manage your own company's jobs" });
        return null;
    }
    if (!canEditRegistration(recruiter.registrationStatus)) {
        res.status(409).json({ message: jobLockedMessage(recruiter.registrationStatus) });
        return null;
    }
    return job;
};

const createJob = async (req, res) => {
    try {
        const recruiter = await findRecruiter(req.user.id);
        if (!canAddJob(recruiter?.registrationStatus)) {
            return res.status(409).json({ message: jobLockedMessage(recruiter?.registrationStatus) });
        }
        const body = { ...withoutServerFields(req.body), jobId: newId("JOB"), companyId: recruiter.companyId, jobStatus: "Open" };
        // Once the registration is approved, new jobs go live at once, approved by the same placement officer.
        if (recruiter.registrationStatus === "Approved") body.approvedByOfficerId = recruiter.officerId;

        const job = new Job(body);
        const savedJob = await job.save();
        res.status(201).json(savedJob);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateJob = async (req, res) => {
    try {
        const job = await findChangeableJob(req, res);
        if (!job) return;

        job.set(withoutServerFields(req.body));
        await job.save();
        res.status(200).json(job);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteJob = async (req, res) => {
    try {
        const job = await findChangeableJob(req, res);
        if (!job) return;

        await job.deleteOne();

        res.status(200).json({ message: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getJobsByCompany = async (req, res) => {
    try {
        const visible = await canSeeCompany(req.user, req.params.companyId);
        const jobs = visible ? await Job.find({ companyId: req.params.companyId }) : [];
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const checkJobEligibility = async (req, res) => {
    try {
        const { studentId, jobId } = req.params;

        const student = await Student.findOne({ enrollmentNo: studentId });
        const job = await Job.findOne({ jobId });

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        if (!job || !await canSeeCompany(req.user, job.companyId)) {
            return res.status(404).json({ message: "Job not found" });
        }

        const isEligible =
            student.cgpa >= job.minCgpa &&
            student.backlogs <= job.maxBacklogs &&
            job.allowedDepartments.includes(student.department);

        res.status(200).json({
            studentId: student.enrollmentNo,
            jobId: job.jobId,
            eligible: isEligible,
            studentCgpa: student.cgpa,
            minCgpa: job.minCgpa,
            studentBacklogs: student.backlogs,
            maxBacklogs: job.maxBacklogs,
            department: student.department,
            allowedDepartments: job.allowedDepartments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    getJobsByCompany,
    checkJobEligibility
};

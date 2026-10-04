const Recruiter = require("../models/Recruiter");
const Company = require("../models/Company");
const Job = require("../models/Job");
const { companyNameKey } = require("../utils/companyName");
const { newId } = require("../utils/ids");
const { canEditRegistration, lockedMessage } = require("../utils/registrationRules");

const RECRUITER_FIELDS = ["recruiterName", "recruiterEmail", "phone", "designation", "password"];
const COMPANY_FIELDS = ["companyName", "industry", "website", "description"];

const DUPLICATE_COMPANY = { message: "This company is already registered on Lakshya.", field: "companyName" };
const DUPLICATE_EMAIL = { message: "This email is already registered. Log in instead.", field: "recruiterEmail" };

const FIELD_LABELS = {
    recruiterName: "Full name",
    recruiterEmail: "Email",
    phone: "Phone",
    designation: "Designation",
    password: "Password",
    companyName: "Company name",
    industry: "Industry",
    website: "Website",
    description: "Company description"
};

const isBlank = (value) => typeof value !== "string" || value.trim() === "";

const sendRequired = (res, field) => res.status(400).json({ message: `${FIELD_LABELS[field]} is required`, field });

const pick = (body, fields) => Object.fromEntries(fields.map((field) => [field, body[field]]));

// Only the fields present in the request, so an edit can change just one of them.
const pickPresent = (body, fields) => pick(body, fields.filter((field) => field in body));

const companyNameTaken = (name, exceptCompanyId) =>
    Company.exists({ nameKey: companyNameKey(name), ...(exceptCompanyId ? { companyId: { $ne: exceptCompanyId } } : {}) });

// A duplicate can still slip past the duplicate checks if two people register at once; the unique indexes catch it.
const sendRegistrationError = (res, error) => {
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
        return res.status(409).json(field === "recruiterEmail" ? DUPLICATE_EMAIL : DUPLICATE_COMPANY);
    }
    return res.status(400).json({ message: error.message });
};

const registerRecruiter = async (req, res) => {
    const missing = [...RECRUITER_FIELDS, ...COMPANY_FIELDS].find((field) => isBlank(req.body[field]));
    if (missing) return sendRequired(res, missing);

    try {
        if (await Recruiter.exists({ recruiterEmail: req.body.recruiterEmail.trim().toLowerCase() })) {
            return res.status(409).json(DUPLICATE_EMAIL);
        }
        if (await companyNameTaken(req.body.companyName)) {
            return res.status(409).json(DUPLICATE_COMPANY);
        }

        const company = await Company.create({
            ...pick(req.body, COMPANY_FIELDS),
            logoUrl: isBlank(req.body.logoUrl) ? undefined : req.body.logoUrl.trim(),
            companyId: newId("COM")
        });

        let recruiter;
        try {
            recruiter = await Recruiter.create({
                ...pick(req.body, RECRUITER_FIELDS),
                recruiterId: newId("REC"),
                companyId: company.companyId,
                registrationStatus: "Draft"
            });
        } catch (error) {
            await Company.deleteOne({ companyId: company.companyId });
            throw error;
        }

        res.status(201).json({ recruiter, company });
    } catch (error) {
        sendRegistrationError(res, error);
    }
};

const EDITABLE_RECRUITER_FIELDS = ["recruiterName", "phone", "designation"];
const EDITABLE_COMPANY_FIELDS = [...COMPANY_FIELDS, "logoUrl"];

// The logged-in recruiter with their company and jobs.
const loadRegistration = async (recruiterId) => {
    const recruiter = await Recruiter.findOne({ recruiterId });
    if (!recruiter) return null;
    const [company, jobs] = await Promise.all([
        Company.findOne({ companyId: recruiter.companyId }),
        Job.find({ companyId: recruiter.companyId })
    ]);
    return { recruiter, company, jobs };
};

const getMyRegistration = async (req, res) => {
    try {
        const registration = await loadRegistration(req.user.id);
        if (!registration) return res.status(404).json({ message: "Recruiter not found" });
        res.status(200).json(registration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateMyRegistration = async (req, res) => {
    const recruiterChanges = pickPresent(req.body, EDITABLE_RECRUITER_FIELDS);
    const companyChanges = pickPresent(req.body, EDITABLE_COMPANY_FIELDS);

    const blank = [...EDITABLE_RECRUITER_FIELDS, ...COMPANY_FIELDS].find((field) => field in req.body && isBlank(req.body[field]));
    if (blank) return sendRequired(res, blank);

    try {
        const registration = await loadRegistration(req.user.id);
        if (!registration) return res.status(404).json({ message: "Recruiter not found" });
        const { recruiter, company } = registration;
        if (!canEditRegistration(recruiter.registrationStatus)) {
            return res.status(409).json({ message: lockedMessage(recruiter.registrationStatus) });
        }

        if (companyChanges.companyName !== undefined && await companyNameTaken(companyChanges.companyName, company.companyId)) {
            return res.status(409).json(DUPLICATE_COMPANY);
        }

        recruiter.set(recruiterChanges);
        company.set(companyChanges);
        if (isBlank(company.logoUrl)) company.logoUrl = undefined;
        await company.save();
        await recruiter.save();

        res.status(200).json(await loadRegistration(req.user.id));
    } catch (error) {
        sendRegistrationError(res, error);
    }
};

const submitMyRegistration = async (req, res) => {
    try {
        const recruiter = await Recruiter.findOne({ recruiterId: req.user.id });
        if (!recruiter) return res.status(404).json({ message: "Recruiter not found" });
        if (!canEditRegistration(recruiter.registrationStatus)) {
            return res.status(409).json({ message: lockedMessage(recruiter.registrationStatus) });
        }

        recruiter.registrationStatus = "Pending";
        recruiter.submittedAt = new Date();
        recruiter.rejectionReason = undefined;
        await recruiter.save();

        res.status(200).json(await loadRegistration(req.user.id));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Placement officer

const listPendingRegistrations = async (req, res) => {
    try {
        const recruiters = await Recruiter.find({ registrationStatus: "Pending" }).sort({ submittedAt: 1 });
        const companyIds = recruiters.map((recruiter) => recruiter.companyId);
        const [companies, jobCounts] = await Promise.all([
            Company.find({ companyId: { $in: companyIds } }),
            Job.aggregate([{ $match: { companyId: { $in: companyIds } } }, { $group: { _id: "$companyId", count: { $sum: 1 } } }])
        ]);
        const countFor = (companyId) => jobCounts.find((item) => item._id === companyId)?.count || 0;

        res.status(200).json(recruiters.map((recruiter) => ({
            recruiter,
            company: companies.find((company) => company.companyId === recruiter.companyId),
            jobCount: countFor(recruiter.companyId)
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRegistration = async (req, res) => {
    try {
        const registration = await loadRegistration(req.params.recruiterId);
        if (!registration) return res.status(404).json({ message: "Company registration not found" });
        res.status(200).json(registration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Finds a registration the placement officer can decide on. Sends the refusal and returns null otherwise.
const findPendingRecruiter = async (req, res) => {
    const recruiter = await Recruiter.findOne({ recruiterId: req.params.recruiterId });
    if (!recruiter) {
        res.status(404).json({ message: "Company registration not found" });
        return null;
    }
    if (recruiter.registrationStatus !== "Pending") {
        res.status(409).json({ message: `This company registration is ${recruiter.registrationStatus.toLowerCase()}, not waiting for review.` });
        return null;
    }
    return recruiter;
};

const approveRegistration = async (req, res) => {
    try {
        const recruiter = await findPendingRecruiter(req, res);
        if (!recruiter) return;

        recruiter.set({ registrationStatus: "Approved", officerId: req.user.id, reviewedAt: new Date(), rejectionReason: undefined });
        await recruiter.save();
        await Job.updateMany({ companyId: recruiter.companyId }, { approvedByOfficerId: req.user.id });

        res.status(200).json(await loadRegistration(recruiter.recruiterId));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const rejectRegistration = async (req, res) => {
    if (isBlank(req.body.reason)) {
        return res.status(400).json({ message: "A rejection reason is required", field: "reason" });
    }

    try {
        const recruiter = await findPendingRecruiter(req, res);
        if (!recruiter) return;

        recruiter.set({ registrationStatus: "Rejected", officerId: req.user.id, reviewedAt: new Date(), rejectionReason: req.body.reason.trim() });
        await recruiter.save();

        res.status(200).json(await loadRegistration(recruiter.recruiterId));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerRecruiter,
    getMyRegistration,
    updateMyRegistration,
    submitMyRegistration,
    listPendingRegistrations,
    getRegistration,
    approveRegistration,
    rejectRegistration
};

const Recruiter = require("../models/Recruiter");
const { listableCompanyIds, canSeeCompany } = require("../utils/visibility");

const getRecruiters = async (req, res) => {
    try {
        const recruiters = await Recruiter.find({ companyId: { $in: await listableCompanyIds(req.user) } });
        res.status(200).json(recruiters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRecruiterById = async (req, res) => {
    try {
        const recruiter = await Recruiter.findOne({ recruiterId: req.params.recruiterId });

        if (!recruiter || !await canSeeCompany(req.user, recruiter.companyId)) {
            return res.status(404).json({ message: "Recruiter not found" });
        }

        res.status(200).json(recruiter);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRecruitersByCompany = async (req, res) => {
    try {
        const visible = await canSeeCompany(req.user, req.params.companyId);
        const recruiters = visible ? await Recruiter.find({ companyId: req.params.companyId }) : [];
        res.status(200).json(recruiters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRecruiters,
    getRecruiterById,
    getRecruitersByCompany
};

const Company = require("../models/Company");
const { listableCompanyIds, canSeeCompany } = require("../utils/visibility");

const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find({ companyId: { $in: await listableCompanyIds(req.user) } });
        res.status(200).json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCompanyById = async (req, res) => {
    try {
        const company = await Company.findOne({ companyId: req.params.companyId });

        if (!company || !await canSeeCompany(req.user, company.companyId)) {
            return res.status(404).json({ message: "Company not found" });
        }

        res.status(200).json(company);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCompanies,
    getCompanyById
};

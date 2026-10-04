const Recruiter = require("../models/Recruiter");

// Nothing from a company registration is visible until the placement officer approves it.
//
// Lists show approved companies (and their recruiters and jobs) to everyone; a recruiter also sees their own.
// A single record can be read by the placement officer and its own recruiter at any status, and by others
// only once approved. Anything else is "not found".

const approvedCompanyIds = () => Recruiter.distinct("companyId", { registrationStatus: "Approved" });

const ownCompanyId = async (user) => (user.role === "recruiter"
    ? (await Recruiter.findOne({ recruiterId: user.id }, "companyId"))?.companyId
    : undefined);

const listableCompanyIds = async (user) => {
    const [approved, own] = await Promise.all([approvedCompanyIds(), ownCompanyId(user)]);
    return own && !approved.includes(own) ? [...approved, own] : approved;
};

const canSeeCompany = async (user, companyId) => {
    if (!companyId) return false;
    if (user.role === "officer") return true;
    if (await ownCompanyId(user) === companyId) return true;
    return Boolean(await Recruiter.exists({ companyId, registrationStatus: "Approved" }));
};

module.exports = { listableCompanyIds, canSeeCompany };

const express = require("express");
const router = express.Router();

const {
    getRecruiters,
    getRecruiterById,
    getRecruitersByCompany
} = require("../controllers/recruiterController");

router.get("/", getRecruiters);
router.get("/company/:companyId", getRecruitersByCompany);
router.get("/:recruiterId", getRecruiterById);

module.exports = router;

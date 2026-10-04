const express = require("express");
const router = express.Router();

const {
    getCompanies,
    getCompanyById
} = require("../controllers/companyController");

router.get("/", getCompanies);
router.get("/:companyId", getCompanyById);

module.exports = router;

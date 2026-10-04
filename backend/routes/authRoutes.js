const express = require("express");
const { login } = require("../controllers/authController");
const { registerRecruiter } = require("../controllers/registrationController");

const router = express.Router();
router.post("/login", login);
router.post("/register-recruiter", registerRecruiter);

module.exports = router;

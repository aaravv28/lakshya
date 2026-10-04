const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ROLE_CONFIG = {
    student: {
        tokenRole: "student",
        idField: "enrollmentNo",
        emailField: "studentEmail",
        nameField: "studentName",
        label: "Student"
    },
    recruiter: {
        tokenRole: "recruiter",
        idField: "recruiterId",
        emailField: "recruiterEmail",
        nameField: "recruiterName",
        label: "Recruiter"
    },
    officer: {
        tokenRole: "officer",
        idField: "officerId",
        emailField: "officerEmail",
        nameField: "officerName",
        label: "Placement Officer"
    }
};

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }
    return process.env.JWT_SECRET;
};

const hashPassword = (password) => bcrypt.hash(password, 12);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

const createToken = ({ id, role }) => jwt.sign(
    { sub: id, role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
);

const verifyToken = (token) => jwt.verify(token, getJwtSecret());

module.exports = {
    ROLE_CONFIG,
    hashPassword,
    comparePassword,
    createToken,
    verifyToken
};

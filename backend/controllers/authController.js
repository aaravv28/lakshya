const Student = require("../models/Student");
const Recruiter = require("../models/Recruiter");
const PlacementOfficer = require("../models/PlacementOfficer");
const { ROLE_CONFIG, comparePassword, createToken } = require("../config/auth");

const models = { student: Student, recruiter: Recruiter, officer: PlacementOfficer };

const login = async (req, res) => {
    const { email, password, role } = req.body;
    const normalizedRole = typeof role === "string" ? role.toLowerCase() : "";
    const config = ROLE_CONFIG[normalizedRole];

    if (!email || !password || !config) {
        return res.status(400).json({ message: "Email, password, and a supported role are required" });
    }

    try {
        const Model = models[normalizedRole];
        const account = await Model.findOne({ [config.emailField]: email.trim().toLowerCase() }).select("+password");

        if (!account || !account.password || !(await comparePassword(password, account.password))) {
            return res.status(401).json({ message: "Invalid email, password, or role" });
        }

        const id = account[config.idField];
        const user = {
            id,
            role: normalizedRole,
            name: account[config.nameField],
            email: account[config.emailField]
        };

        return res.status(200).json({ token: createToken({ id, role: normalizedRole }), role: normalizedRole, user });
    } catch (error) {
        return res.status(500).json({ message: "Authentication service unavailable" });
    }
};

module.exports = { login };

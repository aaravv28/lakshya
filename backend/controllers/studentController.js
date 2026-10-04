const Student = require("../models/Student");
const { comparePassword } = require("../config/auth");

const UNIQUE_FIELD_LABELS = {
    studentEmail: "Email",
    enrollmentNo: "Enrollment number"
};

const STUDENT_EDITABLE_FIELDS = ["skills"];

const isNonEmptyString = (value) => typeof value === "string" && value !== "";

const getStudents = async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getStudentById = async (req, res) => {
    try {
        const student = await Student.findOne({
            enrollmentNo: req.params.enrollmentNo
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const sendWriteError = (res, error) => {
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue || error.keyPattern || {})[0];
        const label = UNIQUE_FIELD_LABELS[field] || field;
        return res.status(409).json({ message: `${label} is already in use`, field });
    }
    return res.status(400).json({ message: error.message });
};

const createStudent = async (req, res) => {
    if (!isNonEmptyString(req.body.password)) {
        return res.status(400).json({ message: "Password is required" });
    }

    try {
        const student = new Student(req.body);
        const savedStudent = await student.save();
        res.status(201).json(savedStudent);
    } catch (error) {
        sendWriteError(res, error);
    }
};

const updateStudent = async (req, res) => {
    if ("password" in req.body) {
        return res.status(400).json({ message: "Password cannot be changed here. Use the password endpoint." });
    }

    if (req.user.role === "student") {
        const disallowed = Object.keys(req.body).filter((field) => !STUDENT_EDITABLE_FIELDS.includes(field));
        if (disallowed.length > 0) {
            return res.status(400).json({ message: `Students can only update their skills. Not allowed: ${disallowed.join(", ")}` });
        }
    }

    // Applications, projects, resumes and notifications link to a student by enrollment number.
    if ("enrollmentNo" in req.body) {
        return res.status(400).json({ message: "Enrollment number cannot be changed" });
    }

    const { skills } = req.body;
    if (skills !== undefined && !(Array.isArray(skills) && skills.every((skill) => typeof skill === "string"))) {
        return res.status(400).json({ message: "Skills must be a list of text" });
    }

    try {
        const student = await Student.findOneAndUpdate(
            { enrollmentNo: req.params.enrollmentNo },
            req.body,
            { returnDocument: "after", runValidators: true }
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json(student);
    } catch (error) {
        sendWriteError(res, error);
    }
};

const replacePassword = (enrollmentNo, newPassword) => Student.findOneAndUpdate({ enrollmentNo }, { password: newPassword });

const changeOwnPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!isNonEmptyString(currentPassword)) {
        return res.status(400).json({ message: "Current password is required" });
    }

    const student = await Student.findOne({ enrollmentNo: req.params.enrollmentNo }).select("+password");
    if (!student || !student.password || !(await comparePassword(currentPassword, student.password))) {
        return res.status(400).json({ message: "Current password is incorrect." });
    }
    if (newPassword === currentPassword) {
        return res.status(400).json({ message: "New password must be different from your current password." });
    }

    await replacePassword(req.params.enrollmentNo, newPassword);
    res.status(200).json({ message: "Password changed." });
};

const resetPassword = async (req, res) => {
    const student = await replacePassword(req.params.enrollmentNo, req.body.newPassword);
    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: `Password updated for ${student.studentName}.` });
};

// Students change their own password (current one required); officers reset any student's.
const setPassword = async (req, res) => {
    if (!isNonEmptyString(req.body.newPassword)) {
        return res.status(400).json({ message: "New password is required" });
    }

    try {
        await (req.user.role === "student" ? changeOwnPassword(req, res) : resetPassword(req, res));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({
            enrollmentNo: req.params.enrollmentNo
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json({
            message: "Student deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    setPassword,
    deleteStudent
};
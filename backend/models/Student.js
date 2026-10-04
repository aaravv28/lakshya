const mongoose = require("mongoose");
const { hashPassword } = require("../config/auth");

const studentSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: true
    },

    studentEmail: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    enrollmentNo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },

    department: {
        type: String,
        required: true
    },

    semester: {
        type: Number,
        required: true
    },

    cgpa: {
        type: Number,
        required: true,
        min: 0,
        max: 10
    },

    backlogs: {
        type: Number,
        required: true,
        min: 0
    },

    skills: {
        type: [String]
    },

    password: {
        type: String,
        select: false
    }
});

studentSchema.pre("save", async function() {
    if (!this.isModified("password") || !this.password) return;
    this.password = await hashPassword(this.password);
});

studentSchema.pre("findOneAndUpdate", async function() {
    const update = this.getUpdate();
    if (update.password) update.password = await hashPassword(update.password);
});

studentSchema.set("toJSON", { transform: (_doc, ret) => { delete ret.password; return ret; } });

module.exports = mongoose.model("Student", studentSchema);
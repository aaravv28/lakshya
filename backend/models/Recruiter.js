const mongoose = require("mongoose");
const { hashPassword } = require("../config/auth");

const recruiterSchema = new mongoose.Schema({
    recruiterId: {
        type: String,
        required: true,
        unique: true
    },

    companyId: {
        type: String,
        required: true
    },

    // The placement officer who reviewed the company registration.
    officerId: {
        type: String
    },

    recruiterName: {
        type: String,
        required: true
    },

    recruiterEmail: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    phone: {
        type: String,
        required: true,
        trim: true
    },

    designation: {
        type: String,
        required: true
    },

    // No default: recruiters from before self-registration have no status until
    // scripts/approveExistingRecruiters.js marks them Approved. Registration always sets Draft.
    registrationStatus: {
        type: String,
        enum: ["Draft", "Pending", "Rejected", "Approved"]
    },

    rejectionReason: {
        type: String
    },

    submittedAt: {
        type: Date
    },

    reviewedAt: {
        type: Date
    },

    password: {
        type: String,
        select: false
    }
});

recruiterSchema.pre("save", async function() {
    if (!this.isModified("password") || !this.password) return;
    this.password = await hashPassword(this.password);
});

recruiterSchema.pre("findOneAndUpdate", async function() {
    const update = this.getUpdate();
    if (update.password) update.password = await hashPassword(update.password);
});

recruiterSchema.set("toJSON", { transform: (_doc, ret) => { delete ret.password; return ret; } });

module.exports = mongoose.model("Recruiter", recruiterSchema);

const mongoose = require("mongoose");
const { hashPassword } = require("../config/auth");

const placementOfficerSchema = new mongoose.Schema({
    officerId: {
        type: String,
        required: true,
        unique: true
    },

    officerName: {
        type: String,
        required: true
    },

    officerEmail: {
        type: String,
        required: true,
        unique: true
    },

    officerDepartment: {
        type: String,
        required: true
    },

    password: {
        type: String,
        select: false
    }
});

placementOfficerSchema.pre("save", async function() {
    if (!this.isModified("password") || !this.password) return;
    this.password = await hashPassword(this.password);
});

placementOfficerSchema.pre("findOneAndUpdate", async function() {
    const update = this.getUpdate();
    if (update.password) update.password = await hashPassword(update.password);
});

placementOfficerSchema.set("toJSON", { transform: (_doc, ret) => { delete ret.password; return ret; } });

module.exports = mongoose.model("PlacementOfficer", placementOfficerSchema, "placementOfficers");

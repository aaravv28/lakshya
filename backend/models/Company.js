const mongoose = require("mongoose");
const { companyNameKey } = require("../utils/companyName");

const companySchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true,
        unique: true
    },

    companyName: {
        type: String,
        required: true,
        trim: true
    },

    // Sparse so companies created before name keys existed don't clash until the migration fills them in.
    nameKey: {
        type: String,
        unique: true,
        sparse: true
    },

    industry: {
        type: String,
        required: true
    },

    website: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    logoUrl: {
        type: String
    }
});

companySchema.pre("validate", function() {
    this.nameKey = companyNameKey(this.companyName);
});

module.exports = mongoose.model("Company", companySchema);

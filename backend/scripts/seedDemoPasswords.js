const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Recruiter = require("../models/Recruiter");
const PlacementOfficer = require("../models/PlacementOfficer");
const { hashPassword } = require("../config/auth");

dotenv.config();

const demoAccounts = [
    { label: "Student 24ITUOZ009", Model: Student, filter: { enrollmentNo: "24ITUOZ009" }, password: "LakshyaStudent@123" },
    { label: "Recruiter REC001", Model: Recruiter, filter: { recruiterId: "REC001" }, password: "LakshyaRecruiter@123" },
    { label: "Placement Officer PO001", Model: PlacementOfficer, filter: { officerId: "PO001" }, password: "LakshyaOfficer@123" }
];

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const results = [];

    for (const account of demoAccounts) {
        const record = await account.Model.findOne(account.filter);
        if (!record) {
            results.push(`${account.label}: NOT FOUND (no record was created)`);
            continue;
        }

        record.password = account.password;
        await record.save();
        results.push(`${account.label}: initialized`);
    }

    console.log(results.join("\n"));
    console.log("Development passwords are documented in the authentication implementation report; change them before production use.");
};

run()
    .catch((error) => {
        console.error("Demo password initialization failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });

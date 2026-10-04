// One-off clean-up for departments saved before they came from a fixed list.
//
// - Renames each student's department, and each job's departments, to the proper name on the list
//   when they differ only in capitals or spacing ("COMPUTER ENGINEERING" -> "Computer Engineering").
// - Stops without changing anything if any department can't be recognised; fix those by hand first.
//
// Shows the plan and changes nothing unless run with --apply:
//   node scripts/fixDepartments.js           (dry run)
//   node scripts/fixDepartments.js --apply   (make the changes)

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { DEPARTMENTS } = require("../utils/departments");
const { properNameFinder } = require("../utils/properName");

const properDepartment = properNameFinder(DEPARTMENTS);

const planDepartmentFix = async (db) => {
    const problems = [];
    const properName = (name, owner) => {
        if (!name) {
            problems.push(`${owner} has no department`);
            return name;
        }
        const proper = properDepartment(name);
        if (!proper) problems.push(`${owner} has unknown department "${name}"`);
        return proper || name;
    };

    const students = [];
    for (const student of await db.collection("students").find({}, { projection: { enrollmentNo: 1, department: 1 } }).toArray()) {
        const department = properName(student.department, `student ${student.enrollmentNo}`);
        if (department !== student.department) students.push({ _id: student._id, enrollmentNo: student.enrollmentNo, from: student.department, department });
    }

    const jobs = [];
    for (const job of await db.collection("jobs").find({}, { projection: { jobId: 1, allowedDepartments: 1 } }).toArray()) {
        const current = job.allowedDepartments || [];
        // Every job must be open to at least one department, or it can't be saved again.
        if (current.length === 0) problems.push(`job ${job.jobId} has no departments`);
        const allowedDepartments = current.map((name) => properName(name, `job ${job.jobId}`));
        if (allowedDepartments.some((name, i) => name !== current[i])) jobs.push({ _id: job._id, jobId: job.jobId, from: current, allowedDepartments });
    }

    return { students, jobs, problems };
};

const applyDepartmentFix = async (db, plan) => {
    for (const student of plan.students) {
        await db.collection("students").updateOne({ _id: student._id }, { $set: { department: student.department } });
    }
    for (const job of plan.jobs) {
        await db.collection("jobs").updateOne({ _id: job._id }, { $set: { allowedDepartments: job.allowedDepartments } });
    }
};

const run = async () => {
    dotenv.config({ quiet: true });
    const apply = process.argv.includes("--apply");
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const plan = await planDepartmentFix(db);
    if (plan.problems.length) {
        console.log(`Not safe to fix, nothing was changed:\n- ${plan.problems.join("\n- ")}\nSet these to a department on the list by hand, then run this again.`);
        process.exitCode = 1;
        return;
    }
    if (!plan.students.length && !plan.jobs.length) {
        console.log("Nothing to fix: every department is already on the list.");
        return;
    }
    for (const student of plan.students) console.log(`student ${student.enrollmentNo}: "${student.from}" -> "${student.department}"`);
    for (const job of plan.jobs) console.log(`job ${job.jobId}: ${job.from.join(", ")} -> ${job.allowedDepartments.join(", ")}`);

    if (!apply) {
        console.log("\nDry run: nothing was changed. Re-run with --apply to make these changes.");
        return;
    }

    await applyDepartmentFix(db, plan);
    console.log("\nDepartments fixed.");
};

if (require.main === module) {
    run()
        .catch((error) => {
            console.error("Fix failed:", error.message);
            process.exitCode = 1;
        })
        .finally(() => mongoose.disconnect());
}

module.exports = { planDepartmentFix, applyDepartmentFix };

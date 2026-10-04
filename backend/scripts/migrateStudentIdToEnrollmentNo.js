// One-off migration: make the enrollment number the only student identifier.
//
// - Re-points applications, notifications, projects and resumes from the old
//   studentId (e.g. "CE069") to the student's enrollment number ("24ITUOZ009").
// - Stores every enrollment number trimmed and in capitals.
// - Removes the old studentId field and its unique index from students.
//
// Shows the plan and changes nothing unless run with --apply:
//   node scripts/migrateStudentIdToEnrollmentNo.js           (dry run)
//   node scripts/migrateStudentIdToEnrollmentNo.js --apply   (make the changes)

const dotenv = require("dotenv");
const mongoose = require("mongoose");

const LINKED_COLLECTIONS = ["applications", "notifications", "projects", "resumes"];

const normalise = (enrollmentNo) => String(enrollmentNo || "").trim().toUpperCase();

const planMigration = async (db) => {
    const students = await db.collection("students").find({}, { projection: { studentId: 1, enrollmentNo: 1, studentName: 1 } }).toArray();
    const pending = students.filter((student) => student.studentId !== undefined);
    const problems = [];

    const newIds = pending.map((student) => normalise(student.enrollmentNo));
    pending.forEach((student, index) => {
        if (!newIds[index]) problems.push(`${student.studentId} (${student.studentName}) has no enrollment number`);
    });
    const allEnrollments = students.map((student) => normalise(student.enrollmentNo));
    const duplicates = allEnrollments.filter((value, index) => value && allEnrollments.indexOf(value) !== index);
    if (duplicates.length) problems.push(`duplicate enrollment numbers: ${[...new Set(duplicates)].join(", ")}`);

    const oldIds = new Set(pending.map((student) => String(student.studentId)));
    pending.forEach((student, index) => {
        if (oldIds.has(newIds[index]) && String(student.studentId) !== newIds[index]) {
            problems.push(`enrollment number ${newIds[index]} is also another student's old ID; re-pointing would mix their records`);
        }
    });

    const moves = [];
    for (const [index, student] of pending.entries()) {
        const linked = {};
        for (const collection of LINKED_COLLECTIONS) {
            linked[collection] = await db.collection(collection).countDocuments({ studentId: student.studentId });
        }
        moves.push({ _id: student._id, from: student.studentId, to: newIds[index], name: student.studentName, linked });
    }

    const recase = students
        .filter((student) => student.studentId === undefined && student.enrollmentNo !== normalise(student.enrollmentNo))
        .map((student) => ({ _id: student._id, from: student.enrollmentNo, to: normalise(student.enrollmentNo) }));

    const indexes = await db.collection("students").indexes();
    const dropIndex = indexes.some((index) => index.name === "studentId_1");

    return { moves, recase, dropIndex, problems };
};

const applyMigration = async (db, plan) => {
    if (plan.dropIndex) await db.collection("students").dropIndex("studentId_1");

    for (const move of plan.moves) {
        for (const collection of LINKED_COLLECTIONS) {
            await db.collection(collection).updateMany({ studentId: move.from }, { $set: { studentId: move.to } });
        }
        await db.collection("students").updateOne({ _id: move._id }, { $set: { enrollmentNo: move.to }, $unset: { studentId: "" } });
    }

    for (const change of plan.recase) {
        await db.collection("students").updateOne({ _id: change._id }, { $set: { enrollmentNo: change.to } });
    }
};

const printPlan = (plan) => {
    if (!plan.moves.length && !plan.recase.length && !plan.dropIndex) {
        console.log("Nothing to migrate.");
        return;
    }
    for (const move of plan.moves) {
        const counts = LINKED_COLLECTIONS.map((collection) => `${move.linked[collection]} ${collection}`).join(", ");
        console.log(`${move.from} -> ${move.to}  (${move.name}; re-points ${counts})`);
    }
    for (const change of plan.recase) console.log(`${change.from} -> ${change.to}  (capitalised)`);
    if (plan.dropIndex) console.log("drop unique index studentId_1 on students");
};

const run = async () => {
    dotenv.config({ quiet: true });
    const apply = process.argv.includes("--apply");
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const plan = await planMigration(db);
    printPlan(plan);

    if (plan.problems.length) {
        console.log(`\nNot safe to migrate:\n- ${plan.problems.join("\n- ")}`);
        process.exitCode = 1;
        return;
    }
    if (!apply) {
        console.log("\nDry run: nothing was changed. Re-run with --apply to make these changes.");
        return;
    }

    await applyMigration(db, plan);
    console.log("\nMigration applied.");
};

if (require.main === module) {
    run()
        .catch((error) => {
            console.error("Migration failed:", error.message);
            process.exitCode = 1;
        })
        .finally(() => mongoose.disconnect());
}

module.exports = { planMigration, applyMigration };

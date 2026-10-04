const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { useTestDatabase } = require("./helpers");
const { planDepartmentFix, applyDepartmentFix } = require("../scripts/fixDepartments");

// Students and jobs saved before departments came from a fixed list.
const seedOldData = async (db, { studentDepartments, jobDepartments = [["Computer Engineering", "Information Technology"]] }) => {
    await db.collection("students").insertMany(studentDepartments.map((department, i) => ({ enrollmentNo: `24CE00${i + 1}`, studentEmail: `student${i + 1}@ddu.ac.in`, department })));
    await db.collection("jobs").insertMany(jobDepartments.map((allowedDepartments, i) => ({ jobId: `JOB00${i + 1}`, allowedDepartments })));
};

describe("fixing departments saved before the list existed", () => {
    useTestDatabase();

    it("renames capitals and spacing variants to the department's proper name, once", async () => {
        const db = mongoose.connection.db;
        await seedOldData(db, {
            studentDepartments: ["COMPUTER ENGINEERING", "Computer engineering", "Computer Engineering", " computer  engineering "],
            jobDepartments: [["information technology", "Computer Engineering"]]
        });

        const plan = await planDepartmentFix(db);
        await applyDepartmentFix(db, plan);
        const students = await db.collection("students").find().toArray();
        const jobs = await db.collection("jobs").find().toArray();
        const again = await planDepartmentFix(db);

        assert.deepEqual(plan.problems, []);
        assert.deepEqual(students.map((student) => student.department), Array(4).fill("Computer Engineering"));
        assert.deepEqual(jobs[0].allowedDepartments, ["Information Technology", "Computer Engineering"]);
        assert.equal(again.students.length + again.jobs.length, 0);
    });

    it("reports every department it can't recognise, naming the student or job", async () => {
        const db = mongoose.connection.db;
        await seedOldData(db, { studentDepartments: ["COMPUTER ENGINEERING", "Comp Engg"], jobDepartments: [["CE"]] });

        const plan = await planDepartmentFix(db);

        assert.equal(plan.problems.length, 2);
        assert.match(plan.problems.join("\n"), /24CE002 .*"Comp Engg"/);
        assert.match(plan.problems.join("\n"), /JOB001 .*"CE"/);
    });

    it("reports a job or student with no department at all", async () => {
        const db = mongoose.connection.db;
        await seedOldData(db, { studentDepartments: [null], jobDepartments: [[]] });
        await db.collection("jobs").insertOne({ jobId: "JOB009" });

        const plan = await planDepartmentFix(db);

        assert.equal(plan.problems.length, 3);
        assert.match(plan.problems.join("\n"), /student 24CE001 has no department/);
        assert.match(plan.problems.join("\n"), /job JOB001 has no departments/);
        assert.match(plan.problems.join("\n"), /job JOB009 has no departments/);
    });
});

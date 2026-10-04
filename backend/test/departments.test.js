const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, api, studentFixture, officerToken } = require("./helpers");
const { jobFixture, newRecruiter } = require("./recruiterRegistration.helpers");

const createAs = (token, body) => api().post("/api/students").set("Authorization", `Bearer ${token}`).send(body);
const updateAs = (token, enrollmentNo, body) => api().put(`/api/students/${enrollmentNo}`).set("Authorization", `Bearer ${token}`).send(body);

describe("departments come only from Lakshya's list", () => {
    useTestDatabase();

    it("adds a student in a department on the list", async () => {
        const token = await officerToken();

        const created = await createAs(token, studentFixture({ department: "Instrumentation & Control" }));

        assert.equal(created.status, 201);
        assert.equal(created.body.department, "Instrumentation & Control");
    });

    it("refuses a student whose department is not on the list, even a near miss", async () => {
        const token = await officerToken();

        for (const department of ["CE", "computer engineering", "Computer Engg", "Aeronautical"]) {
            const created = await createAs(token, studentFixture({ department }));

            assert.equal(created.status, 400, department);
            assert.match(created.body.message, /Department must be one of/);
        }
    });

    it("never changes a student's department, even for the officer", async () => {
        const token = await officerToken();
        await createAs(token, studentFixture());

        const changed = await updateAs(token, "24CE001", { department: "Information Technology" });
        const fetched = await api().get("/api/students/24CE001").set("Authorization", `Bearer ${token}`);

        assert.equal(changed.status, 400);
        assert.match(changed.body.message, /Department cannot be changed/);
        assert.equal(fetched.body.department, "Computer Engineering");
    });

    it("can't be tricked into changing a department or enrollment number with a database operator", async () => {
        const token = await officerToken();
        await createAs(token, studentFixture());

        const department = await updateAs(token, "24CE001", { $set: { department: "Civil" } });
        const enrollment = await updateAs(token, "24CE001", { $set: { enrollmentNo: "24CE999" } });
        const fetched = await api().get("/api/students/24CE001").set("Authorization", `Bearer ${token}`);

        assert.equal(department.status, 400);
        assert.equal(enrollment.status, 400);
        assert.equal(fetched.body.department, "Computer Engineering");
    });

    it("posts a job open to several departments on the list", async () => {
        const recruiter = await newRecruiter();

        const created = await recruiter.post("/api/jobs", jobFixture({ allowedDepartments: ["Civil", "Mechanical"] }));

        assert.equal(created.status, 201);
        assert.deepEqual(created.body.allowedDepartments, ["Civil", "Mechanical"]);
    });

    it("refuses a job with no departments or with one not on the list", async () => {
        const recruiter = await newRecruiter();

        for (const allowedDepartments of [[], ["CE", "IT"], ["Computer Engineering", "Aeronautical"]]) {
            const created = await recruiter.post("/api/jobs", jobFixture({ allowedDepartments }));

            assert.equal(created.status, 400, JSON.stringify(allowedDepartments));
        }

        const { allowedDepartments, ...withoutDepartments } = jobFixture();
        const missing = await recruiter.post("/api/jobs", withoutDepartments);
        assert.equal(missing.status, 400, "departments missing");
    });

    it("refuses editing a job to a department not on the list and keeps the old ones", async () => {
        const recruiter = await newRecruiter();
        const { body: job } = await recruiter.post("/api/jobs", jobFixture());

        const edited = await recruiter.put(`/api/jobs/${job.jobId}`, { allowedDepartments: ["Computer Engg"] });
        const fetched = await recruiter.get(`/api/jobs/${job.jobId}`);

        assert.equal(edited.status, 400);
        assert.match(edited.body.message, /Department must be one of/);
        assert.deepEqual(fetched.body.allowedDepartments, ["Computer Engineering", "Information Technology"]);
    });
});

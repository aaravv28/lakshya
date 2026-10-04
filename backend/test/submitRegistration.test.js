const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase } = require("./helpers");
const { jobFixture, newRecruiter } = require("./recruiterRegistration.helpers");

describe("recruiter submits their company registration", () => {
    useTestDatabase();

    it("sends a draft to the placement officer, even with no jobs", async () => {
        const recruiter = await newRecruiter();

        const response = await recruiter.post("/api/registration/submit");
        const read = await recruiter.get("/api/registration");

        assert.equal(response.status, 200);
        assert.equal(read.body.recruiter.registrationStatus, "Pending");
        assert.ok(read.body.recruiter.submittedAt);
    });

    it("can't be submitted twice", async () => {
        const recruiter = await newRecruiter();
        await recruiter.post("/api/registration/submit");

        const again = await recruiter.post("/api/registration/submit");

        assert.equal(again.status, 409);
    });

    it("locks details, company and jobs while waiting, and keeps them visible", async () => {
        const recruiter = await newRecruiter();
        const job = (await recruiter.post("/api/jobs", jobFixture())).body;
        await recruiter.post("/api/registration/submit");

        const editDetails = await recruiter.put("/api/registration", { phone: "9000000000" });
        const addJob = await recruiter.post("/api/jobs", jobFixture({ jobTitle: "Another" }));
        const editJob = await recruiter.put(`/api/jobs/${job.jobId}`, { package: 1 });
        const deleteJob = await recruiter.delete(`/api/jobs/${job.jobId}`);
        const read = await recruiter.get("/api/registration");

        for (const response of [editDetails, addJob, editJob, deleteJob]) {
            assert.equal(response.status, 409);
        }
        assert.equal(read.body.recruiter.phone, "9123456780");
        assert.deepEqual(read.body.jobs.map((item) => [item.jobTitle, item.package]), [["SDE Intern", 600000]]);
    });
});

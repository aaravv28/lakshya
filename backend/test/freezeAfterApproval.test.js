const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, officerToken, studentToken } = require("./helpers");
const { jobFixture, newRecruiter, asUser } = require("./recruiterRegistration.helpers");

const approvedRecruiter = async () => {
    const officer = asUser(await officerToken());
    const recruiter = await newRecruiter();
    const job = (await recruiter.post("/api/jobs", jobFixture())).body;
    await recruiter.post("/api/registration/submit");
    await officer.post(`/api/registration/${recruiter.recruiterId}/approve`);
    return { officer, recruiter, job };
};

describe("an approved registration is permanent", () => {
    useTestDatabase();

    it("puts a job added after approval live straight away", async () => {
        const { recruiter } = await approvedRecruiter();
        const student = asUser(await studentToken());

        const added = await recruiter.post("/api/jobs", jobFixture({ jobTitle: "New role" }));
        const seen = await student.get("/api/jobs");

        assert.equal(added.status, 201);
        assert.equal(added.body.approvedByOfficerId, "PO001");
        assert.ok(seen.body.some((job) => job.jobTitle === "New role"));
    });

    it("never changes an approved job, by the recruiter or the placement officer", async () => {
        const { officer, recruiter, job } = await approvedRecruiter();

        const byRecruiter = [
            await recruiter.put(`/api/jobs/${job.jobId}`, { package: 1 }),
            await recruiter.delete(`/api/jobs/${job.jobId}`)
        ];
        const byOfficer = [
            await officer.put(`/api/jobs/${job.jobId}`, { package: 1 }),
            await officer.delete(`/api/jobs/${job.jobId}`)
        ];

        for (const response of byRecruiter) {
            assert.equal(response.status, 409);
            assert.equal(response.body.message, "Approved jobs can't be changed.");
        }
        for (const response of byOfficer) assert.equal(response.status, 403);
        assert.equal((await recruiter.get(`/api/jobs/${job.jobId}`)).body.package, 600000);
    });

    it("never changes the recruiter's details or company", async () => {
        const { recruiter } = await approvedRecruiter();

        const response = await recruiter.put("/api/registration", { companyName: "Flipkart India", phone: "9000000000" });
        const read = await recruiter.get("/api/registration");

        assert.equal(response.status, 409);
        assert.equal(response.body.message, "Approved registrations can't be changed.");
        assert.equal(read.body.company.companyName, "Flipkart");
    });

    it("leaves jobs to recruiters: the placement officer can't create or move them", async () => {
        const { officer, recruiter } = await approvedRecruiter();
        const draft = await newRecruiter({ recruiterEmail: "a@myntra.com", companyName: "Myntra" });
        const draftJob = (await draft.post("/api/jobs", jobFixture({ jobTitle: "Draft role" }))).body;

        const create = await officer.post("/api/jobs", { ...jobFixture(), jobId: "JOB-X", companyId: recruiter.companyId, jobStatus: "Open" });
        const move = await officer.put(`/api/jobs/${draftJob.jobId}`, { companyId: recruiter.companyId });
        const read = await draft.get(`/api/jobs/${draftJob.jobId}`);

        assert.equal(create.status, 403);
        assert.equal(move.status, 403);
        assert.equal(read.body.companyId, draft.companyId);
    });

    it("no longer lets anyone add, edit or remove recruiters and companies directly", async () => {
        const { officer, recruiter } = await approvedRecruiter();

        const responses = [
            await officer.post("/api/recruiters", { recruiterId: "REC9", recruiterName: "X" }),
            await officer.put(`/api/recruiters/${recruiter.recruiterId}`, { recruiterName: "X" }),
            await recruiter.put(`/api/recruiters/${recruiter.recruiterId}`, { recruiterName: "X" }),
            await officer.delete(`/api/recruiters/${recruiter.recruiterId}`),
            await officer.post("/api/companies", { companyId: "COM9", companyName: "X" }),
            await officer.put(`/api/companies/${recruiter.companyId}`, { companyName: "X" }),
            await officer.delete(`/api/companies/${recruiter.companyId}`)
        ];

        for (const response of responses) assert.equal(response.status, 404);
        assert.equal((await officer.get(`/api/recruiters/${recruiter.recruiterId}`)).body.recruiterName, "Priya Nair");
        assert.equal((await officer.get(`/api/companies/${recruiter.companyId}`)).body.companyName, "Flipkart");
    });
});

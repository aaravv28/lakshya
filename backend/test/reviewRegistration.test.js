const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, officerToken, studentToken } = require("./helpers");
const { jobFixture, newRecruiter, asUser } = require("./recruiterRegistration.helpers");

const submitted = async (overrides = {}, jobs = 1) => {
    const recruiter = await newRecruiter(overrides);
    for (let index = 0; index < jobs; index += 1) await recruiter.post("/api/jobs", jobFixture({ jobTitle: `Role ${index + 1}` }));
    await recruiter.post("/api/registration/submit");
    return recruiter;
};

describe("placement officer reviews company registrations", () => {
    useTestDatabase();

    it("lists only registrations waiting for review, with their job counts", async () => {
        const officer = asUser(await officerToken());
        const waiting = await submitted({}, 2);
        await newRecruiter({ recruiterEmail: "draft@myntra.com", companyName: "Myntra" });

        const response = await officer.get("/api/registration/pending");

        assert.equal(response.status, 200);
        assert.equal(response.body.length, 1);
        assert.equal(response.body[0].recruiter.recruiterId, waiting.recruiterId);
        assert.equal(response.body[0].company.companyName, "Flipkart");
        assert.equal(response.body[0].jobCount, 2);
        assert.doesNotMatch(JSON.stringify(response.body), /password/i);
    });

    it("shows one registration in full", async () => {
        const officer = asUser(await officerToken());
        const recruiter = await submitted({}, 2);

        const response = await officer.get(`/api/registration/${recruiter.recruiterId}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.recruiter.phone, "9123456780");
        assert.equal(response.body.company.industry, "E-commerce");
        assert.deepEqual(response.body.jobs.map((job) => job.jobTitle), ["Role 1", "Role 2"]);
    });

    it("approves a registration and its jobs together", async () => {
        const officer = asUser(await officerToken());
        const recruiter = await submitted({}, 2);

        const response = await officer.post(`/api/registration/${recruiter.recruiterId}/approve`);
        const read = await recruiter.get("/api/registration");
        const pending = await officer.get("/api/registration/pending");

        assert.equal(response.status, 200);
        assert.equal(read.body.recruiter.registrationStatus, "Approved");
        assert.equal(read.body.recruiter.officerId, "PO001");
        assert.ok(read.body.recruiter.reviewedAt);
        assert.deepEqual(read.body.jobs.map((job) => job.approvedByOfficerId), ["PO001", "PO001"]);
        assert.equal(pending.body.length, 0);
    });

    it("rejects only with a reason, which the recruiter then sees", async () => {
        const officer = asUser(await officerToken());
        const recruiter = await submitted();

        const withoutReason = await officer.post(`/api/registration/${recruiter.recruiterId}/reject`, { reason: "  " });
        const withReason = await officer.post(`/api/registration/${recruiter.recruiterId}/reject`, { reason: "Website doesn't load." });
        const read = await recruiter.get("/api/registration");

        assert.equal(withoutReason.status, 400);
        assert.equal(withReason.status, 200);
        assert.equal(read.body.recruiter.registrationStatus, "Rejected");
        assert.equal(read.body.recruiter.rejectionReason, "Website doesn't load.");
    });

    it("lets a rejected recruiter fix things and submit again", async () => {
        const officer = asUser(await officerToken());
        const recruiter = await submitted();
        await officer.post(`/api/registration/${recruiter.recruiterId}/reject`, { reason: "Description is too short" });

        const edit = await recruiter.put("/api/registration", { description: "India's online marketplace" });
        const addJob = await recruiter.post("/api/jobs", jobFixture({ jobTitle: "Role 2" }));
        const resubmit = await recruiter.post("/api/registration/submit");
        const read = await recruiter.get("/api/registration");
        const pending = await officer.get("/api/registration/pending");

        assert.equal(edit.status, 200);
        assert.equal(addJob.status, 201);
        assert.equal(resubmit.status, 200);
        assert.equal(read.body.recruiter.registrationStatus, "Pending");
        assert.equal(read.body.recruiter.rejectionReason, undefined);
        assert.equal(pending.body[0].jobCount, 2);
    });

    it("only decides on registrations that are waiting", async () => {
        const officer = asUser(await officerToken());
        const draft = await newRecruiter();
        const approved = await submitted({ recruiterEmail: "a@myntra.com", companyName: "Myntra" });
        await officer.post(`/api/registration/${approved.recruiterId}/approve`);

        const approveDraft = await officer.post(`/api/registration/${draft.recruiterId}/approve`);
        const rejectApproved = await officer.post(`/api/registration/${approved.recruiterId}/reject`, { reason: "Changed my mind" });
        const unknown = await officer.post("/api/registration/REC-NOPE/approve");

        assert.equal(approveDraft.status, 409);
        assert.equal(rejectApproved.status, 409);
        assert.equal(unknown.status, 404);
    });

    it("is for the placement officer only", async () => {
        const recruiter = await submitted();
        const student = asUser(await studentToken());

        const responses = [
            await recruiter.get("/api/registration/pending"),
            await recruiter.post(`/api/registration/${recruiter.recruiterId}/approve`),
            await student.get(`/api/registration/${recruiter.recruiterId}`),
            await student.post(`/api/registration/${recruiter.recruiterId}/reject`, { reason: "x" })
        ];

        for (const response of responses) assert.equal(response.status, 403);
    });
});

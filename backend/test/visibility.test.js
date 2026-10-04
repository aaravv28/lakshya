const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, officerToken, studentToken } = require("./helpers");
const { jobFixture, newRecruiter, asUser } = require("./recruiterRegistration.helpers");

// An approved company with one open job, and a draft company with one job.
const setUp = async () => {
    const officer = asUser(await officerToken());
    const approved = await newRecruiter();
    const approvedJob = (await approved.post("/api/jobs", jobFixture({ jobTitle: "Approved role" }))).body;
    await approved.post("/api/registration/submit");
    await officer.post(`/api/registration/${approved.recruiterId}/approve`);

    const draft = await newRecruiter({ recruiterEmail: "a@myntra.com", companyName: "Myntra" });
    const draftJob = (await draft.post("/api/jobs", jobFixture({ jobTitle: "Draft role" }))).body;

    const student = asUser(await studentToken());
    return { officer, approved, approvedJob, draft, draftJob, student };
};

const apply = (student, job) => student.post("/api/applications", {
    applicationId: `APP-${job.jobId}`, studentId: "24CE001", jobId: job.jobId, recruiterId: "REC", applicationStatus: "Applied"
});

describe("only approved companies are visible", () => {
    useTestDatabase();

    it("hides unapproved companies, recruiters and jobs from student lists", async () => {
        const { student } = await setUp();

        const jobs = await student.get("/api/jobs");
        const companies = await student.get("/api/companies");
        const recruiters = await student.get("/api/recruiters");

        assert.deepEqual(jobs.body.map((job) => job.jobTitle), ["Approved role"]);
        assert.deepEqual(companies.body.map((company) => company.companyName), ["Flipkart"]);
        assert.deepEqual(recruiters.body.map((recruiter) => recruiter.recruiterName), ["Priya Nair"]);
    });

    it("answers 'not found' for an unapproved record, even by its address", async () => {
        const { student, draft, draftJob } = await setUp();

        const responses = [
            await student.get(`/api/jobs/${draftJob.jobId}`),
            await student.get(`/api/companies/${draft.companyId}`),
            await student.get(`/api/recruiters/${draft.recruiterId}`),
            await student.get(`/api/jobs/eligibility/24CE001/${draftJob.jobId}`)
        ];

        for (const response of responses) assert.equal(response.status, 404);
        assert.deepEqual((await student.get(`/api/jobs/company/${draft.companyId}`)).body, []);
        assert.deepEqual((await student.get(`/api/recruiters/company/${draft.companyId}`)).body, []);
    });

    it("hides a draft company from other recruiters too", async () => {
        const { approved, draftJob, draft } = await setUp();

        assert.equal((await approved.get(`/api/jobs/${draftJob.jobId}`)).status, 404);
        assert.equal((await approved.get(`/api/companies/${draft.companyId}`)).status, 404);
    });

    it("still shows the owner and the placement officer the unapproved records", async () => {
        const { officer, draft, draftJob } = await setUp();

        for (const user of [officer, draft]) {
            assert.equal((await user.get(`/api/jobs/${draftJob.jobId}`)).status, 200);
            assert.equal((await user.get(`/api/companies/${draft.companyId}`)).status, 200);
            assert.equal((await user.get(`/api/recruiters/${draft.recruiterId}`)).status, 200);
        }
        assert.ok((await draft.get("/api/jobs")).body.some((job) => job.jobId === draftJob.jobId));
    });

    it("lets students apply only to approved jobs whose deadline hasn't passed", async () => {
        const { student, approved, approvedJob, draftJob } = await setUp();
        const pastJob = (await approved.post("/api/jobs", jobFixture({ jobTitle: "Closed role", deadline: "2020-01-01" }))).body;

        const toDraft = await apply(student, draftJob);
        const toPast = await apply(student, pastJob);
        const toOpen = await apply(student, approvedJob);

        assert.equal(toDraft.status, 404);
        assert.equal(toPast.status, 400);
        assert.match(toPast.body.message, /deadline/i);
        assert.equal(toOpen.status, 201);
    });

    it("still takes applications on the deadline day itself", async () => {
        const { student, approved } = await setUp();
        const today = new Date().toISOString().slice(0, 10);
        const dueToday = (await approved.post("/api/jobs", jobFixture({ jobTitle: "Due today", deadline: today }))).body;

        const response = await apply(student, dueToday);

        assert.equal(response.status, 201);
    });
});

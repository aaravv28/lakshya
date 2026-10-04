const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, createCompany } = require("./helpers");
const { jobFixture, newRecruiter } = require("./recruiterRegistration.helpers");

describe("recruiter prepares their company and jobs", () => {
    useTestDatabase();

    it("shows the recruiter their own registration", async () => {
        const recruiter = await newRecruiter();

        const response = await recruiter.get("/api/registration");

        assert.equal(response.status, 200);
        assert.equal(response.body.recruiter.registrationStatus, "Draft");
        assert.equal(response.body.company.companyName, "Flipkart");
        assert.deepEqual(response.body.jobs, []);
        assert.doesNotMatch(JSON.stringify(response.body), /password/i);
    });

    it("lets a draft recruiter edit their details and company, but not their email, ID or status", async () => {
        const recruiter = await newRecruiter();

        const response = await recruiter.put("/api/registration", {
            recruiterName: "Priya N.", phone: "9000000000", designation: "HR Lead",
            companyName: "Flipkart Internet", industry: "Consumer Goods (FMCG)", description: "Shop", logoUrl: "https://fk.com/l.png",
            recruiterEmail: "other@x.com", registrationStatus: "Approved", companyId: "COM999"
        });
        const read = await recruiter.get("/api/registration");

        assert.equal(response.status, 200);
        assert.equal(read.body.recruiter.recruiterName, "Priya N.");
        assert.equal(read.body.recruiter.phone, "9000000000");
        assert.equal(read.body.recruiter.recruiterEmail, "priya@flipkart.com");
        assert.equal(read.body.recruiter.registrationStatus, "Draft");
        assert.equal(read.body.company.companyName, "Flipkart Internet");
        assert.equal(read.body.company.companyId, recruiter.companyId);
        assert.equal(read.body.company.logoUrl, "https://fk.com/l.png");
    });

    it("refuses renaming the company to one already on Lakshya, or blanking a required field", async () => {
        await createCompany({ companyName: "Google" });
        const recruiter = await newRecruiter();

        const duplicate = await recruiter.put("/api/registration", { companyName: " google " });
        const blank = await recruiter.put("/api/registration", { phone: " " });
        const sameName = await recruiter.put("/api/registration", { companyName: "FLIPKART" });

        assert.equal(duplicate.status, 409);
        assert.equal(duplicate.body.field, "companyName");
        assert.equal(duplicate.body.message, "This company is already registered on Lakshya.");
        assert.equal(blank.status, 400);
        assert.equal(blank.body.field, "phone");
        assert.equal(sameName.status, 200);
    });

    it("adds, edits and deletes jobs, always for the recruiter's own company", async () => {
        const recruiter = await newRecruiter();

        const created = await recruiter.post("/api/jobs", jobFixture({ companyId: "COM001", jobId: "JOB001" }));
        const jobId = created.body.jobId;
        const edited = await recruiter.put(`/api/jobs/${jobId}`, { package: 700000, companyId: "COM001" });
        const listed = await recruiter.get("/api/registration");

        assert.equal(created.status, 201);
        assert.equal(created.body.companyId, recruiter.companyId);
        assert.notEqual(jobId, "JOB001");
        assert.equal(created.body.jobStatus, "Open");
        assert.equal(edited.status, 200);
        assert.equal(edited.body.package, 700000);
        assert.equal(edited.body.companyId, recruiter.companyId);
        assert.equal(listed.body.jobs.length, 1);

        const deleted = await recruiter.delete(`/api/jobs/${jobId}`);
        assert.equal(deleted.status, 200);
        assert.equal((await recruiter.get("/api/registration")).body.jobs.length, 0);
    });

    it("refuses a job with missing details", async () => {
        const recruiter = await newRecruiter();

        const response = await recruiter.post("/api/jobs", jobFixture({ jobTitle: "" }));

        assert.equal(response.status, 400);
    });

    it("won't let a recruiter change another company's job", async () => {
        const owner = await newRecruiter();
        const other = await newRecruiter({ recruiterEmail: "a@myntra.com", companyName: "Myntra" });
        const job = (await owner.post("/api/jobs", jobFixture())).body;

        const edit = await other.put(`/api/jobs/${job.jobId}`, { package: 1 });
        const remove = await other.delete(`/api/jobs/${job.jobId}`);

        assert.equal(edit.status, 403);
        assert.equal(remove.status, 403);
        assert.equal((await owner.get("/api/registration")).body.jobs[0].package, 600000);
    });
});

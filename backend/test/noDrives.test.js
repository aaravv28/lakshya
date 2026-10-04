const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, api, officerToken } = require("./helpers");
const { newRecruiter } = require("./recruiterRegistration.helpers");

const job = {
    jobId: "JOB001",
    companyId: "COM001",
    approvedByOfficerId: "PO001",
    jobTitle: "Frontend Intern",
    jobDescription: "Build pages",
    jobType: "Internship",
    package: 300000,
    deadline: "2026-12-31",
    minCgpa: 7,
    maxBacklogs: 0,
    allowedDepartments: ["Computer Engineering"],
    jobStatus: "Open"
};

describe("placement drives are gone", () => {
    useTestDatabase();

    it("creates a job without a drive", async () => {
        const recruiter = await newRecruiter();

        const created = await recruiter.post("/api/jobs", { ...job, driveId: "DRV001" });
        const fetched = await recruiter.get(`/api/jobs/${created.body.jobId}`);

        assert.equal(created.status, 201);
        assert.equal(fetched.status, 200);
        assert.equal(fetched.body.driveId, undefined);
    });

    it("no longer serves the drives API or jobs by drive", async () => {
        const token = await officerToken();

        const drives = await api().get("/api/placement-drives").set("Authorization", `Bearer ${token}`);
        const jobsByDrive = await api().get("/api/jobs/drive/DRV001").set("Authorization", `Bearer ${token}`);

        assert.equal(drives.status, 404);
        assert.equal(jobsByDrive.status, 404);
    });
});

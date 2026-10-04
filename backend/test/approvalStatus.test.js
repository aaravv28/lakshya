const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { useTestDatabase, api, createRecruiter, officerToken } = require("./helpers");
const { planApproval, applyApproval } = require("../scripts/approveExistingRecruiters");

describe("recruiter approval status", () => {
    useTestDatabase();

    it("shows each recruiter's approval status and never their password", async () => {
        const token = await officerToken();
        await createRecruiter();

        const response = await api().get("/api/recruiters/REC001").set("Authorization", `Bearer ${token}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.registrationStatus, "Approved");
        assert.equal(response.body.verified, undefined);
        assert.doesNotMatch(JSON.stringify(response.body), /password/i);
    });
});

describe("recruiter records", () => {
    useTestDatabase();

    it("need a phone number", async () => {
        await assert.rejects(createRecruiter({ phone: undefined }), /phone/);
    });
});

describe("approving existing recruiters script", () => {
    useTestDatabase();

    const seed = async (companies) => {
        const db = mongoose.connection.db;
        await db.collection("recruiters").insertMany([
            { recruiterId: "REC001", companyId: "COM001", recruiterEmail: "a@example.com", verified: true },
            { recruiterId: "REC002", companyId: "COM002", recruiterEmail: "b@example.com", verified: true }
        ]);
        await db.collection("companies").insertMany(companies);
        return db;
    };

    it("marks every recruiter approved and gives each company a name key, once", async () => {
        const db = await seed([{ companyId: "COM001", companyName: " Google  India " }, { companyId: "COM002", companyName: "netflix" }]);

        const plan = await planApproval(db);
        await applyApproval(db, plan);
        const recruiters = await db.collection("recruiters").find().toArray();
        const companies = await db.collection("companies").find().sort({ companyId: 1 }).toArray();
        const again = await planApproval(db);

        assert.deepEqual(plan.problems, []);
        assert.deepEqual(recruiters.map((r) => [r.registrationStatus, r.verified]), [["Approved", undefined], ["Approved", undefined]]);
        assert.deepEqual(companies.map((c) => c.nameKey), ["google india", "netflix"]);
        assert.equal(again.recruiters.length + again.companies.length, 0);
    });

    it("refuses when two companies share a name", async () => {
        const db = await seed([{ companyId: "COM001", companyName: "Google" }, { companyId: "COM002", companyName: "GOOGLE " }]);

        const plan = await planApproval(db);

        assert.equal(plan.problems.length, 1);
        assert.match(plan.problems[0], /google/i);
    });
});

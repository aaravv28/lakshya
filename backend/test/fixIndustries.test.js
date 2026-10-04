const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { useTestDatabase } = require("./helpers");
const { planIndustryFix, applyIndustryFix } = require("../scripts/fixIndustries");

// Companies saved before industries came from a fixed list.
const seedCompanies = (db, industries) => db.collection("companies").insertMany(
    industries.map((industry, i) => ({ companyId: `COM00${i + 1}`, companyName: `Company ${i + 1}`, industry }))
);

describe("fixing industries saved before the list existed", () => {
    useTestDatabase();

    it("renames variants to the proper name and Software and Consulting to E-commerce, once", async () => {
        const db = mongoose.connection.db;
        await seedCompanies(db, ["Software Development", "information  technology", "Software and Consulting"]);

        const plan = await planIndustryFix(db);
        await applyIndustryFix(db, plan);
        const companies = await db.collection("companies").find().sort({ companyId: 1 }).toArray();
        const again = await planIndustryFix(db);

        assert.deepEqual(plan.problems, []);
        assert.deepEqual(companies.map((company) => company.industry), ["Software Development", "Information Technology", "E-commerce"]);
        assert.equal(again.companies.length, 0);
    });

    it("reports every industry it can't recognise, and a missing one, naming the company", async () => {
        const db = mongoose.connection.db;
        await seedCompanies(db, ["Retail", null]);

        const plan = await planIndustryFix(db);

        assert.equal(plan.problems.length, 2);
        assert.match(plan.problems.join("\n"), /company COM001 .*"Retail"/);
        assert.match(plan.problems.join("\n"), /company COM002 .*has no industry/);
    });
});

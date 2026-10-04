const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, api } = require("./helpers");
const { registrationFixture, newRecruiter } = require("./recruiterRegistration.helpers");

const register = (body) => api().post("/api/auth/register-recruiter").send(body);

describe("a company's details", () => {
    useTestDatabase();

    it("are registered without a website, and one sent anyway is not kept", async () => {
        const plain = await register(registrationFixture());
        const withWebsite = await register(registrationFixture({ recruiterEmail: "ravi@myntra.com", companyName: "Myntra", website: "https://myntra.com" }));

        assert.equal(plain.status, 201);
        assert.equal(withWebsite.status, 201);
        assert.equal(withWebsite.body.company.website, undefined);
    });

    it("never keep a website edited in later", async () => {
        const recruiter = await newRecruiter();

        await recruiter.put("/api/registration", { website: "https://fk.com" });
        const read = await recruiter.get("/api/registration");

        assert.equal(read.body.company.website, undefined);
    });

    it("are registered with an industry on the list", async () => {
        const response = await register(registrationFixture({ industry: "Consumer Goods (FMCG)" }));

        assert.equal(response.status, 201);
        assert.equal(response.body.company.industry, "Consumer Goods (FMCG)");
    });

    it("refuse an industry not on the list, naming the field, and create nothing", async () => {
        for (const industry of ["Retail", "e-commerce", "Software and Consulting"]) {
            const response = await register(registrationFixture({ industry }));

            assert.equal(response.status, 400, industry);
            assert.equal(response.body.field, "industry", industry);
            assert.match(response.body.message, /Industry must be one of/);
        }

        const retry = await register(registrationFixture());
        assert.equal(retry.status, 201, "nothing half-registered blocks a correct retry");
    });

    it("refuse editing the industry to one not on the list, and keep the old one", async () => {
        const recruiter = await newRecruiter();

        const edit = await recruiter.put("/api/registration", { industry: "Retail" });
        const read = await recruiter.get("/api/registration");

        assert.equal(edit.status, 400);
        assert.equal(edit.body.field, "industry");
        assert.equal(read.body.company.industry, "E-commerce");
    });
});

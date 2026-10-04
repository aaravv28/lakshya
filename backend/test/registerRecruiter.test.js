const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, api, login, officerToken, createCompany } = require("./helpers");

const registration = (overrides = {}) => ({
    recruiterName: "Priya Nair",
    recruiterEmail: "priya@flipkart.com",
    phone: "9123456780",
    designation: "Talent Lead",
    password: "priya-pass",
    companyName: "Flipkart",
    industry: "E-commerce",
    description: "Online marketplace",
    ...overrides
});

const register = (body) => api().post("/api/auth/register-recruiter").send(body);

describe("recruiter registers", () => {
    useTestDatabase();

    it("creates a draft registration the recruiter can log in to straight away", async () => {
        const response = await register(registration());
        const loggedIn = await login("priya@flipkart.com", "priya-pass", "recruiter");

        assert.equal(response.status, 201);
        assert.equal(response.body.recruiter.registrationStatus, "Draft");
        assert.equal(response.body.company.companyName, "Flipkart");
        assert.equal(response.body.recruiter.companyId, response.body.company.companyId);
        assert.doesNotMatch(JSON.stringify(response.body), /password/i);
        assert.equal(loggedIn.status, 200);
        assert.equal(loggedIn.body.user.id, response.body.recruiter.recruiterId);
    });

    it("makes up its own IDs and status, whatever the form sends", async () => {
        const response = await register(registration({ recruiterId: "REC001", companyId: "COM001", registrationStatus: "Approved", officerId: "PO001" }));

        assert.equal(response.status, 201);
        assert.notEqual(response.body.recruiter.recruiterId, "REC001");
        assert.notEqual(response.body.company.companyId, "COM001");
        assert.equal(response.body.recruiter.registrationStatus, "Draft");
        assert.equal(response.body.recruiter.officerId, undefined);
    });

    it("refuses a company already on Lakshya, ignoring capitals and spaces", async () => {
        await createCompany({ companyName: "Google" });

        const response = await register(registration({ companyName: "  GOOGLE " }));
        const loggedIn = await login("priya@flipkart.com", "priya-pass", "recruiter");

        assert.equal(response.status, 409);
        assert.equal(response.body.field, "companyName");
        assert.equal(response.body.message, "This company is already registered on Lakshya.");
        assert.equal(loggedIn.status, 401);
    });

    it("refuses an email that's already registered, and creates no company", async () => {
        await register(registration());

        const response = await register(registration({ recruiterEmail: " PRIYA@Flipkart.com ", companyName: "Myntra" }));
        const again = await register(registration({ recruiterEmail: "someone@myntra.com", companyName: "Myntra" }));

        assert.equal(response.status, 409);
        assert.equal(response.body.field, "recruiterEmail");
        assert.equal(again.status, 201);
    });

    it("asks for every required field", async () => {
        for (const field of ["recruiterName", "recruiterEmail", "phone", "designation", "password", "companyName", "industry", "description"]) {
            const response = await register(registration({ [field]: "" }));
            assert.equal(response.status, 400, field);
            assert.equal(response.body.field, field, field);
        }

        const officer = await officerToken();
        const companies = await api().get("/api/companies").set("Authorization", `Bearer ${officer}`);
        assert.equal(companies.body.length, 0);
    });

    it("keeps the logo optional", async () => {
        const withLogo = await register(registration({ logoUrl: "https://flipkart.com/logo.png" }));
        const withoutLogo = await register(registration({ recruiterEmail: "a@myntra.com", companyName: "Myntra" }));

        assert.equal(withLogo.status, 201);
        assert.equal(withLogo.body.company.logoUrl, "https://flipkart.com/logo.png");
        assert.equal(withoutLogo.status, 201);
    });
});

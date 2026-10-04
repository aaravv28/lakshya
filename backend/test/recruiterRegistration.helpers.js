const { api, tokenFor } = require("./helpers");

const registrationFixture = (overrides = {}) => ({
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

const jobFixture = (overrides = {}) => ({
    jobTitle: "SDE Intern",
    jobDescription: "Build things",
    jobType: "Internship",
    package: 600000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    minCgpa: 7,
    maxBacklogs: 0,
    allowedDepartments: ["Computer Engineering", "Information Technology"],
    ...overrides
});

// Registers a new recruiter and returns a small client acting as them.
const newRecruiter = async (overrides = {}) => {
    const body = registrationFixture(overrides);
    const registered = await api().post("/api/auth/register-recruiter").send(body);
    if (registered.status !== 201) throw new Error(`Registration failed: ${registered.status} ${JSON.stringify(registered.body)}`);
    const token = await tokenFor(body.recruiterEmail, body.password, "recruiter");
    return asUser(token, { recruiterId: registered.body.recruiter.recruiterId, companyId: registered.body.company.companyId });
};

const asUser = (token, extra = {}) => {
    const auth = (req) => req.set("Authorization", `Bearer ${token}`);
    return {
        token,
        ...extra,
        get: (path) => auth(api().get(path)),
        post: (path, body) => auth(api().post(path)).send(body),
        put: (path, body) => auth(api().put(path)).send(body),
        delete: (path) => auth(api().delete(path))
    };
};

module.exports = { registrationFixture, jobFixture, newRecruiter, asUser };

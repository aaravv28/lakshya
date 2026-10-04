process.env.JWT_SECRET = "test-secret";

const { after, afterEach, before } = require("node:test");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const Student = require("../models/Student");
const Recruiter = require("../models/Recruiter");
const Company = require("../models/Company");
const PlacementOfficer = require("../models/PlacementOfficer");

let mongo;

const useTestDatabase = () => {
    before(async () => {
        mongo = await MongoMemoryServer.create();
        await mongoose.connect(mongo.getUri());
        await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    });

    afterEach(async () => {
        await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
    });

    after(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });
};

const api = () => request(app);

const studentFixture = (overrides = {}) => ({
    studentName: "Asha Patel",
    studentEmail: "asha@ddu.ac.in",
    enrollmentNo: "24CE001",
    department: "Computer Engineering",
    semester: 5,
    cgpa: 8.2,
    backlogs: 0,
    skills: ["React"],
    password: "student-pass",
    ...overrides
});

const createStudent = (overrides) => Student.create(studentFixture(overrides));

const createRecruiter = (overrides = {}) => Recruiter.create({
    recruiterId: "REC001",
    companyId: "COM001",
    officerId: "PO001",
    recruiterName: "Rahul Shah",
    recruiterEmail: "rahul@example.com",
    designation: "HR",
    phone: "9876543210",
    registrationStatus: "Approved",
    password: "recruiter-pass",
    ...overrides
});

const companyFixture = (overrides = {}) => ({
    companyId: "COM001",
    companyName: "Google",
    industry: "Technology",
    website: "https://google.com",
    description: "Search and cloud",
    ...overrides
});

const createCompany = (overrides) => Company.create(companyFixture(overrides));

const createOfficer = (overrides = {}) => PlacementOfficer.create({
    officerId: "PO001",
    officerName: "Meera Joshi",
    officerEmail: "meera@ddu.ac.in",
    officerDepartment: "Placement Cell",
    password: "officer-pass",
    ...overrides
});

const login = (email, password, role) => api().post("/api/auth/login").send({ email, password, role });

const tokenFor = async (email, password, role) => {
    const response = await login(email, password, role);
    if (response.status !== 200) throw new Error(`Login failed for ${email}: ${response.status}`);
    return response.body.token;
};

const officerToken = async () => {
    await createOfficer();
    return tokenFor("meera@ddu.ac.in", "officer-pass", "officer");
};

const recruiterToken = async () => {
    await createRecruiter();
    return tokenFor("rahul@example.com", "recruiter-pass", "recruiter");
};

const studentToken = async (overrides = {}) => {
    const student = await createStudent(overrides);
    return tokenFor(student.studentEmail, overrides.password || "student-pass", "student");
};

module.exports = {
    useTestDatabase,
    api,
    studentFixture,
    createStudent,
    createRecruiter,
    createCompany,
    createOfficer,
    companyFixture,
    login,
    tokenFor,
    officerToken,
    recruiterToken,
    studentToken
};

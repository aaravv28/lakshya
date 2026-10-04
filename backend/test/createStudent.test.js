const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, api, studentFixture, login, officerToken, recruiterToken, studentToken } = require("./helpers");

const createAs = (token, body) => api().post("/api/students").set("Authorization", `Bearer ${token}`).send(body);

describe("officer adds a student", () => {
    useTestDatabase();

    it("creates a student who can log in with the given password", async () => {
        const token = await officerToken();

        const created = await createAs(token, studentFixture({ password: "first-pass" }));
        const loggedIn = await login("asha@ddu.ac.in", "first-pass", "student");

        assert.equal(created.status, 201);
        assert.equal(created.body.password, undefined);
        assert.equal(loggedIn.status, 200);
    });

    it("stores the email so the student can log in whatever capitals or spaces are typed", async () => {
        const token = await officerToken();

        await createAs(token, studentFixture({ studentEmail: " Asha@DDU.ac.in " }));
        const loggedIn = await login("  ASHA@ddu.AC.IN ", "student-pass", "student");

        assert.equal(loggedIn.status, 200);
        assert.equal(loggedIn.body.user.email, "asha@ddu.ac.in");
    });

    it("refuses a student without a password", async () => {
        const token = await officerToken();
        const { password, ...withoutPassword } = studentFixture();

        const missing = await createAs(token, withoutPassword);
        const empty = await createAs(token, studentFixture({ password: "" }));

        assert.equal(missing.status, 400);
        assert.equal(empty.status, 400);
    });

    it("refuses a CGPA outside 0-10 or negative backlogs", async () => {
        const token = await officerToken();

        const highCgpa = await createAs(token, studentFixture({ cgpa: 11 }));
        const negativeCgpa = await createAs(token, studentFixture({ cgpa: -1 }));
        const negativeBacklogs = await createAs(token, studentFixture({ backlogs: -1 }));

        assert.equal(highCgpa.status, 400);
        assert.equal(negativeCgpa.status, 400);
        assert.equal(negativeBacklogs.status, 400);
    });

    it("names the clashing field when an email or enrollment number is already in use", async () => {
        const token = await officerToken();
        await createAs(token, studentFixture());
        const other = { studentEmail: "ravi@ddu.ac.in", enrollmentNo: "24CE002" };

        const sameEmail = await createAs(token, studentFixture({ ...other, studentEmail: "ASHA@ddu.ac.in" }));
        const sameEnrollment = await createAs(token, studentFixture({ ...other, enrollmentNo: "24CE001" }));

        assert.equal(sameEmail.status, 409);
        assert.equal(sameEmail.body.field, "studentEmail");
        assert.equal(sameEmail.body.message, "Email is already in use");
        assert.equal(sameEnrollment.status, 409);
        assert.equal(sameEnrollment.body.field, "enrollmentNo");
        assert.equal(sameEnrollment.body.message, "Enrollment number is already in use");
    });

    it("uses the enrollment number, in capitals, as the student's ID", async () => {
        const token = await officerToken();

        await createAs(token, studentFixture({ enrollmentNo: " 24ce005 " }));
        const fetched = await api().get("/api/students/24CE005").set("Authorization", `Bearer ${token}`);
        const loggedIn = await login("asha@ddu.ac.in", "student-pass", "student");

        assert.equal(fetched.status, 200);
        assert.equal(fetched.body.enrollmentNo, "24CE005");
        assert.equal(fetched.body.studentId, undefined);
        assert.equal(loggedIn.body.user.id, "24CE005");
    });

    it("only lets officers add students", async () => {
        const asStudent = await createAs(await studentToken(), studentFixture({ studentEmail: "ravi@ddu.ac.in", enrollmentNo: "24CE002" }));
        const asRecruiter = await createAs(await recruiterToken(), studentFixture({ studentEmail: "neha@ddu.ac.in", enrollmentNo: "24CE003" }));

        assert.equal(asStudent.status, 403);
        assert.equal(asRecruiter.status, 403);
    });
});

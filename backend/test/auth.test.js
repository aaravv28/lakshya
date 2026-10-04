const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, createStudent, login } = require("./helpers");

describe("login", () => {
    useTestDatabase();

    it("lets a student log in with their password", async () => {
        await createStudent();

        const response = await login("asha@ddu.ac.in", "student-pass", "student");

        assert.equal(response.status, 200);
        assert.equal(response.body.role, "student");
        assert.ok(response.body.token);
    });

    it("gives every failed login the same message", async () => {
        await createStudent();
        await createStudent({ studentEmail: "ravi@ddu.ac.in", enrollmentNo: "24CE002", password: undefined });

        const failures = await Promise.all([
            login("asha@ddu.ac.in", "wrong-pass", "student"),
            login("nobody@ddu.ac.in", "student-pass", "student"),
            login("asha@ddu.ac.in", "student-pass", "recruiter"),
            login("ravi@ddu.ac.in", "anything", "student")
        ]);

        for (const response of failures) {
            assert.equal(response.status, 401);
            assert.equal(response.body.message, "Invalid email, password, or role");
        }
    });

    it("asks for email, password and role", async () => {
        const responses = await Promise.all([
            login("", "student-pass", "student"),
            login("asha@ddu.ac.in", "", "student"),
            login("asha@ddu.ac.in", "student-pass", "")
        ]);

        for (const response of responses) {
            assert.equal(response.status, 400);
        }
    });
});

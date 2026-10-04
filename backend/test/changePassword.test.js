const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, api, createStudent, login, officerToken, studentToken } = require("./helpers");

const changeAs = (token, studentId, body) => api().put(`/api/students/${studentId}/password`).set("Authorization", `Bearer ${token}`).send(body);

describe("student changes their own password", () => {
    useTestDatabase();

    it("replaces the password and keeps the student logged in", async () => {
        const token = await studentToken();

        const response = await changeAs(token, "24CE001", { currentPassword: "student-pass", newPassword: "my-own-pass" });
        const withOld = await login("asha@ddu.ac.in", "student-pass", "student");
        const withNew = await login("asha@ddu.ac.in", "my-own-pass", "student");
        const stillLoggedIn = await api().get("/api/students/24CE001").set("Authorization", `Bearer ${token}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.message, "Password changed.");
        assert.equal(withOld.status, 401);
        assert.equal(withNew.status, 200);
        assert.equal(stillLoggedIn.status, 200);
    });

    it("explains why a change was refused and keeps the old password", async () => {
        const token = await studentToken();

        const wrongCurrent = await changeAs(token, "24CE001", { currentPassword: "guess", newPassword: "my-own-pass" });
        const sameAsCurrent = await changeAs(token, "24CE001", { currentPassword: "student-pass", newPassword: "student-pass" });
        const missingCurrent = await changeAs(token, "24CE001", { newPassword: "my-own-pass" });
        const missingNew = await changeAs(token, "24CE001", { currentPassword: "student-pass" });
        const withOld = await login("asha@ddu.ac.in", "student-pass", "student");

        assert.equal(wrongCurrent.status, 400);
        assert.equal(wrongCurrent.body.message, "Current password is incorrect.");
        assert.equal(sameAsCurrent.status, 400);
        assert.equal(sameAsCurrent.body.message, "New password must be different from your current password.");
        assert.equal(missingCurrent.status, 400);
        assert.equal(missingNew.status, 400);
        assert.equal(withOld.status, 200);
    });

    it("refuses to change another student's password", async () => {
        await createStudent({ studentEmail: "ravi@ddu.ac.in", enrollmentNo: "24CE002", password: "ravi-pass" });
        const token = await studentToken();

        const response = await changeAs(token, "24CE002", { currentPassword: "ravi-pass", newPassword: "taken-over" });
        const raviStillIn = await login("ravi@ddu.ac.in", "ravi-pass", "student");

        assert.equal(response.status, 403);
        assert.equal(raviStillIn.status, 200);
    });

    it("still lets the officer set a password without the current one", async () => {
        await createStudent();

        const response = await changeAs(await officerToken(), "24CE001", { newPassword: "reset-pass" });

        assert.equal(response.status, 200);
        assert.equal((await login("asha@ddu.ac.in", "reset-pass", "student")).status, 200);
    });
});

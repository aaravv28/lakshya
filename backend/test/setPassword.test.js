const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, api, createStudent, login, officerToken, recruiterToken } = require("./helpers");

const setPasswordAs = (token, studentId, body) => api().put(`/api/students/${studentId}/password`).set("Authorization", `Bearer ${token}`).send(body);

describe("officer sets a student's password", () => {
    useTestDatabase();

    it("replaces the old password immediately", async () => {
        await createStudent();
        const token = await officerToken();

        const response = await setPasswordAs(token, "24CE001", { newPassword: "reset-pass" });
        const withOld = await login("asha@ddu.ac.in", "student-pass", "student");
        const withNew = await login("asha@ddu.ac.in", "reset-pass", "student");

        assert.equal(response.status, 200);
        assert.equal(response.body.message, "Password updated for Asha Patel.");
        assert.equal(withOld.status, 401);
        assert.equal(withNew.status, 200);
    });

    it("lets a student who never had a password log in once one is set", async () => {
        await createStudent({ password: undefined });
        const token = await officerToken();
        const before = await login("asha@ddu.ac.in", "first-pass", "student");

        await setPasswordAs(token, "24CE001", { newPassword: "first-pass" });
        const after = await login("asha@ddu.ac.in", "first-pass", "student");

        assert.equal(before.status, 401);
        assert.equal(after.status, 200);
    });

    it("refuses an empty password and an unknown student", async () => {
        await createStudent();
        const token = await officerToken();

        const empty = await setPasswordAs(token, "24CE001", { newPassword: "" });
        const missing = await setPasswordAs(token, "24CE001", {});
        const unknown = await setPasswordAs(token, "24CE999", { newPassword: "reset-pass" });
        const stillOld = await login("asha@ddu.ac.in", "student-pass", "student");

        assert.equal(empty.status, 400);
        assert.equal(missing.status, 400);
        assert.equal(unknown.status, 404);
        assert.equal(stillOld.status, 200);
    });

    it("refuses recruiters", async () => {
        await createStudent();

        const response = await setPasswordAs(await recruiterToken(), "24CE001", { newPassword: "reset-pass" });

        assert.equal(response.status, 403);
    });
});

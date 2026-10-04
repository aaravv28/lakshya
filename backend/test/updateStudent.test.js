const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { useTestDatabase, api, createStudent, login, officerToken, recruiterToken, studentToken } = require("./helpers");

const updateAs = (token, studentId, body) => api().put(`/api/students/${studentId}`).set("Authorization", `Bearer ${token}`).send(body);
const fetchAs = (token, studentId) => api().get(`/api/students/${studentId}`).set("Authorization", `Bearer ${token}`);

describe("updating a student profile", () => {
    useTestDatabase();

    it("lets a student update their own skills", async () => {
        const token = await studentToken();

        const response = await updateAs(token, "24CE001", { skills: ["React", "Node"] });
        const fetched = await fetchAs(token, "24CE001");

        assert.equal(response.status, 200);
        assert.deepEqual(fetched.body.skills, ["React", "Node"]);
    });

    it("refuses any other field from a student and saves nothing", async () => {
        const token = await studentToken();
        const forbidden = {
            cgpa: 9.9,
            backlogs: 3,
            studentEmail: "new@ddu.ac.in",
            department: "Information Technology",
            semester: 7,
            studentName: "Someone Else",
            enrollmentNo: "24CE999"
        };

        for (const [field, value] of Object.entries(forbidden)) {
            const alone = await updateAs(token, "24CE001", { [field]: value });
            const withSkills = await updateAs(token, "24CE001", { skills: ["Hacking"], [field]: value });

            assert.equal(alone.status, 400, `${field} alone`);
            assert.match(alone.body.message, new RegExp(field));
            assert.equal(withSkills.status, 400, `${field} with skills`);
            assert.match(withSkills.body.message, new RegExp(field));
        }

        const fetched = await fetchAs(token, "24CE001");
        assert.equal(fetched.body.cgpa, 8.2);
        assert.equal(fetched.body.studentEmail, "asha@ddu.ac.in");
        assert.equal(fetched.body.studentName, "Asha Patel");
        assert.equal(fetched.body.backlogs, 0);
        assert.equal(fetched.body.department, "Computer Engineering");
        assert.equal(fetched.body.semester, 5);
        assert.equal(fetched.body.enrollmentNo, "24CE001");
        assert.deepEqual(fetched.body.skills, ["React"]);
    });

    it("only accepts skills as a list of text", async () => {
        const token = await studentToken();

        const asText = await updateAs(token, "24CE001", { skills: "React" });
        const withNumber = await updateAs(token, "24CE001", { skills: ["React", 5] });
        const fetched = await fetchAs(token, "24CE001");

        assert.equal(asText.status, 400);
        assert.equal(withNumber.status, 400);
        assert.deepEqual(fetched.body.skills, ["React"]);
    });

    it("never returns a password", async () => {
        const token = await studentToken();

        const responses = [
            await fetchAs(token, "24CE001"),
            await api().get("/api/students").set("Authorization", `Bearer ${token}`),
            await updateAs(token, "24CE001", { skills: ["Node"] })
        ];

        for (const response of responses) {
            assert.equal(response.status, 200);
            assert.doesNotMatch(JSON.stringify(response.body), /password/i);
        }
    });

    it("never changes a password, even for an officer", async () => {
        const studentAuth = await studentToken();
        const officerAuth = await officerToken();

        const byStudent = await updateAs(studentAuth, "24CE001", { password: "sneaky" });
        const byOfficer = await updateAs(officerAuth, "24CE001", { password: "sneaky", cgpa: 9 });
        const withOld = await login("asha@ddu.ac.in", "student-pass", "student");
        const fetched = await fetchAs(officerAuth, "24CE001");

        assert.equal(byStudent.status, 400);
        assert.equal(byOfficer.status, 400);
        assert.match(byOfficer.body.message, /password/i);
        assert.equal(withOld.status, 200);
        assert.equal(fetched.body.cgpa, 8.2);
    });

    it("never changes an enrollment number, even for an officer", async () => {
        const officerAuth = await officerToken();
        await createStudent();

        const response = await updateAs(officerAuth, "24CE001", { enrollmentNo: "24CE777" });
        const fetched = await fetchAs(officerAuth, "24CE001");

        assert.equal(response.status, 400);
        assert.match(response.body.message, /enrollment/i);
        assert.equal(fetched.status, 200);
    });

    it("lets only the officer change other students' records", async () => {
        await createStudent({ studentEmail: "ravi@ddu.ac.in", enrollmentNo: "24CE002" });
        const studentAuth = await studentToken();
        const officerAuth = await officerToken();

        const otherStudent = await updateAs(studentAuth, "24CE002", { skills: ["Java"] });
        const byRecruiter = await updateAs(await recruiterToken(), "24CE001", { skills: ["Java"] });
        const byOfficer = await updateAs(officerAuth, "24CE001", { cgpa: 9.1, backlogs: 1 });
        const outOfRange = await updateAs(officerAuth, "24CE001", { cgpa: 11 });
        const duplicateEmail = await updateAs(officerAuth, "24CE001", { studentEmail: "Ravi@ddu.ac.in" });
        const fetched = await fetchAs(officerAuth, "24CE001");

        assert.equal(otherStudent.status, 403);
        assert.equal(byRecruiter.status, 403);
        assert.equal(byOfficer.status, 200);
        assert.equal(outOfRange.status, 400);
        assert.equal(duplicateEmail.status, 409);
        assert.equal(duplicateEmail.body.field, "studentEmail");
        assert.equal(fetched.body.cgpa, 9.1);
        assert.equal(fetched.body.backlogs, 1);
    });
});

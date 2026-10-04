# 01: Backend test setup

**What to build:** Prep work that makes the rest easy to test. The backend app can be loaded by tests without starting the server or connecting to the real database, and `npm test` in the backend runs HTTP-level tests against a temporary in-memory MongoDB. A first test proves an existing student can log in with their password. Small shared helpers let later tests create a student, recruiter or officer and get a token for them by logging in. Starting the backend normally behaves exactly as before.

Parent: docs/issues/0001-student-passwords-no-activate-page.md

**Blocked by:** None (can start immediately)

**Status:** done

- [ ] Starting the backend the usual way still connects to the configured database and serves requests as before.
- [ ] `npm test` in the backend replaces the placeholder script and passes with no real MongoDB or network.
- [ ] A test logs in a student with a known password via the login endpoint → 200 with a token and the student role.
- [ ] Later tests can get an officer, student or recruiter token with one helper call.

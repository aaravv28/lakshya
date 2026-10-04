---
title: Student passwords set by the placement officer (no Activate Account page)
labels: [done]
status: closed
decision-record: docs/specs/student-passwords.md
sub-issues:
  - docs/issues/0002-officer-students-page-add-student-and-set-password.md
  - docs/issues/0003-login-page-forgot-password-guidance.md
  - docs/issues/0004-student-profile-skills-only-and-change-password.md
---

> **Umbrella issue: all work lives in the sub-issues.** 0002 covers the officer's Students page (Add student, Set password). 0003 covers the login page line and login-behaviour tests. 0004 covers the student profile (skills-only editing, Change password, and the general-update rules). Build those; close this issue when all three are done.

## Problem Statement

A placement officer creates student records, but those records have no password, so the student can never log in. The only way a password gets set today is a developer seed script. There is no screen for the officer to add a student, no way to recover a forgotten password, and no way for a student to choose their own password.

The student profile form also lets a student edit anything about themselves, including their CGPA, backlogs, department, semester and email. It also lets them overwrite their password directly without knowing the current one. For a placement portal where eligibility depends on CGPA and backlogs, that is a correctness problem, not just a security one.

An "Activate Account" page was considered and **rejected**: this is a semester demo, there is no email infrastructure, and the officer is already the source of truth for student records.

## Solution

- The placement officer adds each student from the officer's Students page, typing in an initial password, and hands it to the student outside the app.
- The student logs in normally with that password and lands on their dashboard. There is no activation step.
- Changing the password is **optional**, from a "Change password" section on the student's profile, which requires the current password.
- A student who forgets their password asks the placement officer, who uses a "Set password" action on that student's row. The login page tells students this.
- Students can edit **only their skills**. Every other profile field is read-only to them and changeable only by the officer.

## User Stories

1. As a placement officer, I want an "Add student" button on the Students page, so that I can create student records without a developer.
2. As a placement officer, I want the Add student form to ask for Student ID, full name, email, enrollment number, department, semester, CGPA, backlogs, skills and password, so that a new student is complete and can log in immediately.
3. As a placement officer, I want skills to be optional on the Add student form, so that I don't have to guess a student's skills.
4. As a placement officer, I want the password to be required on the Add student form, so that I never create a student who cannot log in.
5. As a placement officer, I want to type any non-empty password with no length rule, so that I can hand out simple passwords during the demo.
6. As a placement officer, I want the form to tell me which field clashes when a Student ID, email or enrollment number is already in use, so that I can fix just that field.
7. As a placement officer, I want the form to keep what I typed when saving fails, so that I don't have to re-enter everything.
8. As a placement officer, I want the new student to appear in the Students table right after saving, with a confirmation message, so that I know it worked.
9. As a placement officer, I want CGPA limited to 0–10 and backlogs to 0 or more, so that I can't create impossible records by mistake.
10. As a placement officer, I want emails saved in lowercase regardless of how I typed them, so that the student can always log in with their email.
11. As a placement officer, I want a "Set password" button on every student row, so that I can help a student who forgot their password.
12. As a placement officer, I want "Set password" to ask only for the new password, so that resetting is quick.
13. As a placement officer, I want a message like "Password updated for <name>" after setting a password, so that I know which student I changed.
14. As a placement officer, I want the student's old password to stop working as soon as I set a new one, so that a reset actually takes effect.
15. As a placement officer, I want passwords never to be shown back to me, so that stored passwords stay private even from staff.
16. As a placement officer, I want to use "Set password" on students created before this feature (who have no password), so that I can bring existing records into use.
17. As a placement officer, I want to remain the only person who can change a student's name, email, enrollment number, department, semester, CGPA and backlogs, so that eligibility data stays trustworthy.
18. As a student, I want to log in with the email and password my placement officer gave me, so that I can start using the portal right away.
19. As a student, I want to land on my dashboard after my first login, with no extra activation step, so that getting started is simple.
20. As a student, I want to keep using the officer's password if I choose, so that changing it is my decision.
21. As a student, I want a "Change password" section on my profile, so that I can choose a password only I know.
22. As a student, I want to enter my current password when changing it, so that someone using my unattended session can't lock me out.
23. As a student, I want to type the new password twice, so that a typo doesn't lock me out.
24. As a student, I want "Current password is incorrect." when I get the current one wrong, so that I know what to fix.
25. As a student, I want "New passwords do not match." when the two new entries differ, so that I know what to fix.
26. As a student, I want "New password must be different from your current password." when I re-enter the same one, so that a change is always a real change.
27. As a student, I want "Required" shown on any empty password field, so that I can see what's missing.
28. As a student, I want "Password changed." and cleared fields after a successful change, and to stay logged in on my profile, so that nothing interrupts me.
29. As a student, I want no minimum length on my new password, so that the demo is easy to use.
30. As a student, I want the login page to say "Forgot your password? Contact your placement officer.", so that I know how to get back in.
31. As a student, I want to edit my skills on my profile, so that recruiters see what I can do now.
32. As a student, I want my name, email, enrollment number, department, semester, CGPA and backlogs shown read-only on my profile, so that I can check them but know the officer owns them.
33. As a student, I want a clear error if something tries to change a field I'm not allowed to edit, so that nothing appears to succeed and then quietly fail.
34. As a recruiter, I want students' CGPA and backlogs to have been set by the placement officer, so that I can trust eligibility checks.
35. As a developer, I want a password to change only through Change password or the officer's Add student / Set password, so that the current-password rule can't be bypassed through the general update.

## Implementation Decisions

**Terminology.** No "activation", "activated" status or "Register" concept exists for students. A student's account is usable as soon as it has a password.

**Student model**
- Email is stored trimmed and lowercased, enforced in the model so every write path gets it. Login already lowercases its input.
- The password stays optional in the schema (older records have none) and is never returned in any response, as today.
- CGPA is validated to 0–10 and backlogs to 0 or more in the model, per the existing API documentation's validation rules.

**Creating a student** (`POST /api/students`, officer only; unchanged route and role)
- `password` becomes required when creating; a missing or empty password is a 400.
- A duplicate Student ID, email or enrollment number returns **409** with a message naming the clashing field (e.g. `{"message": "Email is already in use", "field": "studentEmail"}`) instead of the raw database error text.
- The response is the created student without a password, as today.

**New dedicated password endpoint:** `PUT /api/students/:studentId/password`
- **Student, own ID only:** body `{ currentPassword, newPassword }`.
  - Missing field → 400.
  - Current password wrong → 400 `"Current password is incorrect."`
  - New password same as current → 400 `"New password must be different from your current password."`
  - Success → 200 `{ "message": "Password changed." }`. The existing token stays valid, so the student stays logged in.
- **Officer, any student:** body `{ newPassword }`; no current password needed. Success → 200 `{ "message": "Password updated for <name>." }`. Unknown student → 404.
- A student targeting another student's ID, or a recruiter calling it at all → 403.
- No minimum length; only non-empty.
- Whether the confirmation field matches is checked on the frontend only; the API takes a single `newPassword`.

**General update** (`PUT /api/students/:studentId`)
- **Never accepts `password`, from anyone** → 400 naming the field. Passwords change only through the endpoint above or on creation.
- **Student (own ID):** the only allowed field is `skills`. Any other field in the body → 400 listing the disallowed fields; nothing is saved.
- **Officer:** may update every field except `password`.
- The existing role/ownership check (self or officer) is kept.

**Frontend**
- *Officer Students page:* stays a table, plus an "Add student" button opening a form (fields as in stories 2–3), and a "Set password" button per row opening a one-field dialog. Show the 409 field message against the matching input.
- *Student profile:* the edit form becomes skills-only; other fields render read-only. Add a "Change password" section (current / new / confirm) with the messages from stories 24–28.
- *Login page:* add the static line "Forgot your password? Contact your placement officer." No link.
- No new routes; no Activate Account page.

**Backend structure**
- Split the Express app from process startup: one module builds and exports the configured app (middleware and routes), and the entry point connects to MongoDB and starts listening. This is the test seam (see below) and changes nothing at runtime.
- The development seed script keeps working unchanged.

## Testing Decisions

**What makes a good test.** Tests go through the public HTTP API only: send a request with a real JWT for a given role, then check the status code, response body, and whether a later **login** succeeds. They never read database fields, hashes or controller internals directly. For example, "the password changed" is proven by logging in with the new password and failing with the old one.

**The seam: the backend HTTP API. It is the only one.** Tests load the exported Express app (after the app/startup split) with supertest, against a disposable in-memory MongoDB (mongodb-memory-server), and a test `JWT_SECRET`. Every decision in this spec is visible at this level.

**Modules covered** (through that seam):
- Student creation: required password; duplicate ID/email/enrollment → 409 naming the field; email lowercased (proven by logging in with a differently-cased email); CGPA/backlog ranges; non-officer → 403; the new student can log in immediately.
- Password endpoint: student happy path (old fails, new works); wrong current; same as current; missing fields; student targeting another student → 403; officer reset without current password; officer reset on a student who had no password → can now log in; recruiter → 403; unknown student → 404.
- General update: student updating skills → 200; student sending CGPA/backlogs/email/etc. → 400 and nothing changes; anyone sending `password` → 400; officer updating CGPA → 200.
- Responses never include `password`.

**Prior art.** None: the repo has no tests yet (the backend `test` script is a placeholder). This work adds the test runner (e.g. Jest or node:test with supertest and mongodb-memory-server) and wires up `npm test` in the backend.

**Frontend.** Not automatically tested (the frontend has no test setup either). Check by hand: add a student, log in as them, change the password, reset it as the officer, confirm read-only profile fields and the login-page line.

## Out of Scope

- An Activate Account page, activated/pending status, email or OTP verification.
- Self-service "forgot password" or reset links.
- Password expiry, strength or length rules, login rate limiting, forcing a change at first login.
- Recruiter and placement-officer password management.
- An officer screen for editing existing student details (the API allows it; there's no UI).
- Notifying the student in-app when the officer resets their password.
- Tightening who can **read** student records.

## Further Notes

- This is for a semester demo; the relaxed password rules are deliberate. The decision record is `docs/specs/student-passwords.md`.
- Students with no password stay locked out (normal "Invalid email, password, or role" error) until the officer uses Set password. No migration is needed.
- The student profile form currently sends every field on save; it must send only `skills`, or the new rule will reject every profile save.

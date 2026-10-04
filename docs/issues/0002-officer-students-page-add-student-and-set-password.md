---
title: "Officer's Students page: Add student and Set password"
labels: [done]
status: closed
parent: docs/issues/0001-student-passwords-no-activate-page.md
decision-record: docs/specs/student-passwords.md
---

## Problem Statement

The placement officer's Students page is a read-only table. The officer is supposed to be the person who creates student accounts and hands out their passwords, but there's no way to do either in the app. A new student can only be added by calling the API directly, and a student who forgets their password has no way back in, because nobody can set a new one without a developer running a script.

Existing student records created without a password can't log in at all, and the officer can't fix that.

## Solution

The officer's Students page gains two actions, both done without leaving the page:

- **Add student:** a button in the page header opens a form above the table. The officer fills in the student's details and types an initial password. On save, the student appears in the table and can log in immediately with that email and password.
- **Set password:** each table row gets a "Set password" button. It opens a small form naming the student, where the officer types a new password. On save, the student's old password stops working and the new one works straight away.

The officer never sees a stored password. They only ever type a new one and pass it to the student outside the app.

This issue is the officer-page slice of the parent issue *Student passwords set by the placement officer (no Activate Account page)*. It includes only the backend behaviour this page depends on.

## User Stories

1. As a placement officer, I want an "Add student" button in the Students page header, so that adding a student is visibly where I manage students.
2. As a placement officer, I want the Add student form to open on the same page above the table, so that I keep my place in the student list.
3. As a placement officer, I want the header button to read "Cancel" while the form is open, so that I can close it without saving.
4. As a placement officer, I want cancelling to throw away what I typed, so that the next student starts from a blank form.
5. As a placement officer, I want fields for Student ID, full name, email, enrollment number, department, semester, CGPA, backlogs, skills and password, so that the new student is complete and ready to log in.
6. As a placement officer, I want every field except skills to be required, so that I can't create a half-finished student.
7. As a placement officer, I want to enter skills as a comma-separated list, so that I can add several at once.
8. As a placement officer, I want blank entries and surrounding spaces removed from skills, so that stray commas don't create empty skills.
9. As a placement officer, I want semester, CGPA and backlogs to be number inputs, so that I can't type letters by mistake.
10. As a placement officer, I want CGPA limited to 0–10 and backlogs to 0 or more, so that impossible values are refused.
11. As a placement officer, I want the password to be required but with no length rule, so that I can hand out simple demo passwords.
12. As a placement officer, I want the password field to hide what I type, so that people nearby can't read it off my screen.
13. As a placement officer, I want the save button to be disabled and show "Saving…" while the request runs, so that I can't create the same student twice by double-clicking.
14. As a placement officer, I want a clear message naming the field when a Student ID, email or enrollment number is already in use, so that I know exactly what to change.
15. As a placement officer, I want the form to keep everything I typed when saving fails, so that I only fix the one problem.
16. As a placement officer, I want any other save error shown on the form in plain words, so that I'm never left guessing whether it worked.
17. As a placement officer, I want the form to close and the table to refresh with the new student after a successful save, so that I can see them straight away.
18. As a placement officer, I want a confirmation such as "Student added: <name>" after saving, so that I know it worked.
19. As a placement officer, I want the email saved in lowercase however I typed it, so that the student can always log in.
20. As a placement officer, I want the student to be able to log in with the email and password I just entered, so that I can hand over their details immediately.
21. As a placement officer, I want a "Set password" button on every student row, so that I can help any student who forgot their password.
22. As a placement officer, I want the Set password form to name the student it's for, so that I don't reset the wrong account.
23. As a placement officer, I want only one student's Set password form open at a time, so that it's always clear who I'm changing.
24. As a placement officer, I want Set password to ask only for the new password, so that resetting is quick.
25. As a placement officer, I want to be told the password is required if I leave it empty, so that I don't set a blank password.
26. As a placement officer, I want a Cancel option on the Set password form, so that I can back out without changing anything.
27. As a placement officer, I want "Password updated for <name>." after a successful reset, so that I know which student I changed.
28. As a placement officer, I want the student's old password to stop working the moment I set a new one, so that a reset actually takes effect.
29. As a placement officer, I want to use Set password on older students who have no password, so that I can make those records usable.
30. As a placement officer, I want the current password never shown or pre-filled anywhere, so that stored passwords stay private even from me.
31. As a placement officer, I want an error on the form if the student was deleted meanwhile, so that I know the reset didn't happen.
32. As a placement officer, I want the existing table columns (name, department, CGPA, backlogs) to stay as they are, so that the page still works as a directory.
33. As a placement officer, I want the Add student and Set password controls on the Students page only, not on Companies or Recruiters, so that those pages don't change.
34. As a student, I want to log in with the details my placement officer gave me, so that I can start using the portal.
35. As a recruiter or student, I want to be refused if I try to add a student or set someone's password through the API, so that only the officer controls accounts.

## Implementation Decisions

**Page structure**
- The officer's Students page currently shares a generic table page with Companies and Recruiters. The student-specific actions go in **only for Students**: either the shared page gains optional hooks for a header action and a per-row action, or Students gets its own page built from the same parts. Companies and Recruiters must look and behave exactly as they do now.
- Existing table columns are unchanged. A final actions column holds the "Set password" button.

**Interaction pattern**
- There is no modal component. Follow the student profile's existing pattern: a page-header action button toggles a form rendered on the page (between header and table), using the existing field and form-grid components.
- Add student and Set password never show at the same time. Opening one closes the other.
- Success messages appear above the table after the form closes. Error messages appear inside the open form.

**Add student form**
- Fields and types: Student ID (text), full name (text), email (email), enrollment number (text), department (text), semester (number), CGPA (number, 0–10, step 0.01), backlogs (number, ≥ 0), skills (text, comma-separated, optional), password (password input, required, no length rule).
- Browser-level `required`/`min`/`max` catch simple mistakes. The backend is the authority.
- On submit: skills are split on commas, trimmed, and empty entries dropped; numbers are sent as numbers.
- Calls **`POST /api/students`** (officer only; existing route).

**Backend contract for creating a student** (shared with the parent issue)
- `password` is required and must not be empty → otherwise 400.
- Email stored trimmed and lowercased.
- CGPA 0–10, backlogs ≥ 0, other listed fields required → otherwise 400 with a readable message.
- A duplicate Student ID, email or enrollment number → **409** `{ "message": "<Field> is already in use", "field": "<fieldName>" }`. The form shows that message, and marks the named field if it can.
- Success → 201 with the student, never including the password.
- Non-officer → 403 (existing behaviour).

**Set password form**
- Shows "Set password for <student name> (<Student ID>)", one password input (required, no length rule), Save and Cancel.
- Calls **`PUT /api/students/:studentId/password`** with `{ newPassword }`.

**Backend contract for the officer setting a password** (the officer half of the parent issue's password endpoint)
- Officer: no current password needed. Success → 200 `{ "message": "Password updated for <name>." }`. The old password stops working immediately.
- Empty or missing `newPassword` → 400. Unknown student → 404. Recruiter → 403.
- The student branch (change own password with the current one) belongs to the parent issue. If this slice ships first, the endpoint may accept officers only until then.

**Not changed:** login, the officer's other pages, and the students list endpoint.

## Testing Decisions

**What makes a good test.** Behaviour only, through the backend HTTP API: send a request with a real officer, student or recruiter token, then check the status, response body and whether logging in succeeds. Never read hashes or database fields directly. For example, "reset worked" means the old password fails to log in and the new one succeeds.

**The seam: the backend HTTP API**, the same single seam confirmed for the parent issue. Load the exported Express app with supertest against a temporary in-memory MongoDB. If the parent issue hasn't already done so, this slice does the groundwork: split the app from server startup, and add the test runner and `npm test`.

**Cases**
- Create: officer creates a student, who can then log in immediately; mixed-case email still logs in; missing password → 400; CGPA 11 or negative backlogs → 400; duplicate Student ID / email / enrollment number → 409 with the matching `field`; student or recruiter → 403; response has no password.
- Officer sets a password: old password fails and new one works; student who had no password can now log in; empty password → 400; unknown student → 404; recruiter → 403.

**Prior art:** none; the repo has no tests yet.

**Frontend: checked by hand.**
- Add a student, see them in the table, log in as them.
- Trigger each duplicate error and see the form keep its values.
- Reset a password and log in with the new one.
- Confirm Companies and Recruiters pages are unchanged.

## Out of Scope

- The student's own "Change password" profile section, skills-only profile editing, removing `password` from the general update, and the login-page "contact your placement officer" line. These are all in the parent issue.
- Editing or deleting existing students from this page.
- Searching, filtering, sorting or paginating the Students table.
- Bulk import (CSV) of students.
- Generating passwords automatically, showing or copying a password after saving, or emailing it to the student.
- An activated/pending status column (there is no activation concept).
- Adding similar actions to the Companies or Recruiters pages.

## Further Notes

- This is for a demo: no password length rules, on purpose.
- The officer passes the password to the student outside the app. Nothing in the app shows it again.
- The seed script and its demo credentials keep working.

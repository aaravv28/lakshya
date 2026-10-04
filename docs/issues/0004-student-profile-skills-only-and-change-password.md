---
title: "Student profile: skills-only editing and Change password"
labels: [done]
status: closed
parent: docs/issues/0001-student-passwords-no-activate-page.md
decision-record: docs/specs/student-passwords.md
---

## Problem Statement

A student's profile page lets them edit everything about themselves: name, email, department, semester, CGPA and backlogs. CGPA and backlogs decide which jobs a student is eligible for, so a student can make themselves eligible just by typing a higher CGPA. Changing the email silently changes their login. The backend accepts all of it, and also accepts a new password through the same update without asking for the current one.

Meanwhile the one thing students should keep up to date, their skills, is awkward to edit. Commas vanish as they're typed, so a second skill can't be added.

Students also have no way to change the password the placement officer gave them. Anyone the officer told it to, or who saw it written down, can keep using it.

When a profile save fails, nothing is shown, so the student can't tell whether it worked.

## Solution

- The profile page keeps its current read-only view of all the student's details. **"Edit profile" becomes "Edit skills"**: the only thing a student can change about their profile is their skills. Name, email, enrollment number, Student ID, department, semester, CGPA and backlogs are shown read-only, and the placement officer owns them.
- Skills are typed as a comma-separated list that behaves like normal text while typing. It's cleaned up (trimmed, blanks dropped) only on save.
- A new **Change password** section on the profile asks for current password, new password and confirm new password. Changing is optional; a student may keep the officer's password forever.
- Every save shows a clear success or error message.
- The backend enforces all of this, so a student can't bypass it by calling the API directly.

## User Stories

1. As a student, I want to see my name, email, enrollment number, Student ID, department, semester, CGPA, backlogs and skills on my profile, so that I can check my placement record.
2. As a student, I want an "Edit skills" button instead of "Edit profile", so that it's clear what I can change.
3. As a student, I want my other details to stay visible while I edit my skills, so that I keep the full picture.
4. As a student, I want to type skills as a comma-separated list, so that I can add several at once.
5. As a student, I want commas to stay in the box while I type, so that I can actually add a second skill.
6. As a student, I want the edit box to start with my current skills, so that I only change what's needed.
7. As a student, I want extra spaces and empty entries removed when I save, so that "React, , Node " saves as "React" and "Node".
8. As a student, I want to be able to save an empty skills list, so that I can clear skills I no longer want shown.
9. As a student, I want the Save button disabled and showing "Saving…" while it saves, so that I don't submit twice.
10. As a student, I want "Skills updated." after saving, with the form closed and my new skills shown, so that I know it worked.
11. As a student, I want an error message if saving my skills fails, with what I typed kept, so that I can try again.
12. As a student, I want Cancel to close the skills editor without saving, so that I can back out.
13. As a student, I want my CGPA and backlogs shown but not editable, so that I understand the placement officer controls my eligibility data.
14. As a student, I want my email shown but not editable, so that I can't accidentally change the email I log in with.
15. As a student, I want my department and semester shown but not editable, so that my academic record stays as the college recorded it.
16. As a student, I want a short note saying to contact my placement officer if any read-only detail is wrong, so that I know how to get it corrected.
17. As a student, I want a "Change password" section on my profile, so that I can replace the password my officer gave me.
18. As a student, I want changing my password to be optional, so that I can keep using the officer's password if I'm happy with it.
19. As a student, I want to enter my current password to change it, so that someone using my unattended session can't lock me out.
20. As a student, I want to type my new password twice, so that a typo doesn't lock me out.
21. As a student, I want all three password fields to hide what I type, so that people nearby can't see my passwords.
22. As a student, I want "Required" on any empty password field, so that I can see what's missing.
23. As a student, I want "New passwords do not match." before anything is sent when my two new entries differ, so that I can fix it immediately.
24. As a student, I want "Current password is incorrect." when I get my current password wrong, so that I know what to fix.
25. As a student, I want "New password must be different from your current password." when I re-use it, so that a change is always a real change.
26. As a student, I want no minimum length on my new password, so that the demo is easy to use.
27. As a student, I want the Change password button disabled and showing "Changing…" while it works, so that I don't submit twice.
28. As a student, I want "Password changed." and all three fields cleared after success, so that my passwords don't stay on screen.
29. As a student, I want to stay logged in on my profile after changing my password, so that nothing interrupts me.
30. As a student, I want my new password to work the next time I log in and my old one to stop working, so that the change protects me.
31. As a student, I want the password fields cleared when a change fails for a wrong current password, so that I retype carefully rather than resubmitting the same mistake.
32. As a student, I want to be refused if I try to change another student's password through the API, so that nobody can take over my account.
33. As a placement officer, I want students unable to change their own CGPA, backlogs, department, semester, name, email or enrollment number, even through the API, so that eligibility checks are trustworthy.
34. As a placement officer, I want to still be able to update any student field except the password through the API, so that I can correct records.
35. As a recruiter, I want the CGPA and backlogs I see to be the ones the placement officer recorded, so that I can rely on eligibility filtering.
36. As a developer, I want the general student update to reject `password` from anyone, so that the current-password check can't be bypassed.
37. As a developer, I want a student's rejected update to save nothing at all, so that a request never half-succeeds.

## Implementation Decisions

**Profile page (frontend)**
- The read-only detail view stays as it is (avatar, name, email, skills tags, enrollment number, department, semester, CGPA, backlogs, Student ID) and **stays visible while editing**.
- The header action changes from "Edit profile" to **"Edit skills"**, becoming "Cancel" while open. The edit form contains **only** a skills text input.
- The skills input holds **raw text** while editing (starting from the current skills joined with ", "). It is split on commas, trimmed and emptied of blanks **only when saving**. This fixes the vanishing-comma bug.
- Save sends **only `{ skills }`**. Sending any other field would now be rejected (see below), so this change is required, not optional.
- Save shows "Saving…" and is disabled while pending. On success: close the editor, reload, show "Skills updated.". On failure: keep the editor open with the text intact and show the server's message. Errors are no longer silently ignored.
- Add a one-line note under the details: "Details other than skills are managed by your placement officer. Contact them if something is wrong."

**Change password section (frontend)**
- A separate section below the profile details, always visible (no toggle), titled "Change password".
- Fields: Current password, New password, Confirm new password. All are password inputs; browser autocomplete hints are current-password / new-password.
- Checked in the browser before sending: all three filled (else "Required" per field); new = confirm (else "New passwords do not match."). No length rule.
- Sends `{ currentPassword, newPassword }` to the student's own password endpoint. Shows "Changing…" and is disabled while pending.
- Success: "Password changed.", all fields cleared, the student stays on the page and stays logged in (the existing token remains valid).
- Failure: show the server's message. For "Current password is incorrect." clear all three fields; for other errors keep the new-password fields.

**Password endpoint (`PUT /api/students/:studentId/password`): student branch**
- Only for the logged-in student's own `studentId`. Another student's ID → 403. The officer branch is specified in sub-issue 0002; one endpoint serves both.
- Body `{ currentPassword, newPassword }`. Either missing or empty → 400.
- Wrong current → 400 "Current password is incorrect."
- New equals current → 400 "New password must be different from your current password."
- Success → 200 `{ "message": "Password changed." }`, with the new password stored hashed through the model's existing hashing.
- A student with no stored password can't reach this page anyway, since they can't log in. The endpoint treats them like a wrong current password.

**General student update (`PUT /api/students/:studentId`)**
- **Never accepts `password`**, from any role → 400 naming the field.
- **Student (own ID only, existing check kept):** the only allowed key is `skills` (an array of strings). Any other key → 400 listing the disallowed fields, and **nothing is saved**.
- **Officer:** any field except `password`, with the model's validation (CGPA 0–10, backlogs ≥ 0, lowercase email, unique fields → 409 as in 0002).
- Recruiters → 403 (unchanged).

## Testing Decisions

**What makes a good test.** Behaviour only, through the backend HTTP API: requests with real student, officer or recruiter tokens in; status and body out. "Nothing was saved" is proven by fetching the student afterwards through the API, and "password changed" by logging in, never by reading the database or hashes.

**The seam: the backend HTTP API**, the same single seam confirmed for 0001–0003. The exported Express app is tested with supertest against a temporary in-memory MongoDB. Setup is done by whichever issue lands first.

**Cases**
- Student updates own skills → 200; fetching the student shows the new skills.
- Student sends `cgpa`, `backlogs`, `studentEmail`, `department`, `semester`, `studentName` or `enrollmentNo` (alone, or alongside `skills`) → 400 naming them; fetching shows nothing changed, including skills.
- Anyone sending `password` to the general update → 400; the old password still logs in.
- Student updating another student → 403. Officer updating CGPA → 200. Recruiter → 403.
- Student changes password: new logs in, old fails. Wrong current → 400 with the exact message. Same as current → 400. Missing field → 400. Another student's ID → 403. The token used before the change still works afterwards.
- No response ever includes `password`.

**Frontend: checked by hand, no automated test** (no frontend test setup, and one seam is preferred).
- Type "React, Node" and see the comma stay; save; see two tags.
- Force a failed save and see the error.
- Confirm no other field is editable.
- Try each Change password error.
- Change the password, log out, and log in with the new one.

**Prior art:** none; the repo has no tests yet.

## Out of Scope

- The officer's Add student / Set password (0002) and the login page (0003).
- Editing projects or resume (separate pages, unchanged).
- Profile photos, or richer skill input such as tags, autocomplete or ratings.
- A way for students to request corrections to read-only fields in the app (they contact the officer outside it).
- Password strength rules, expiry, forcing a change, or logging out other sessions after a change.
- Tightening who can read student records.

## Further Notes

- After this, 0002, 0003 and 0004 together cover everything in parent issue 0001, which becomes an umbrella issue with no work of its own.
- This is a demo; the relaxed password rules are deliberate.

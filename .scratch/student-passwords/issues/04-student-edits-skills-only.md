# 04: Students can edit only their skills

**What to build:** On the student profile, "Edit profile" becomes "Edit skills". The student can change only their skills, while name, email, enrollment number, Student ID, department, semester, CGPA and backlogs stay visible and read-only. A note says to contact the placement officer about anything wrong. Commas stay in the skills box while typing (skills are parsed only on save), and every save shows "Skills updated." or the real error. The API enforces the same rules:
- a student may change only their own skills; any other field is rejected and nothing is saved;
- nobody can set a password through the general student update;
- the officer can still change every field except the password.

Parent: docs/issues/0004-student-profile-skills-only-and-change-password.md

**Blocked by:** 01 (Backend test setup)

**Status:** done

- [ ] API: a student updates own skills → 200, and fetching the student shows them.
- [ ] API: a student sending `cgpa`, `backlogs`, `studentEmail`, `department`, `semester`, `studentName` or `enrollmentNo` (alone or alongside `skills`) → 400 naming them; fetching shows nothing changed, skills included.
- [ ] API: `password` sent by a student or an officer to the general update → 400, and the old password still logs in.
- [ ] API: a student updating another student → 403; officer updating CGPA → 200; recruiter → 403.
- [ ] Manual: type "React, Node", save, see two tags. A failed save shows an error. No other field is editable.

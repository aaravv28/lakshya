# 02: Officer adds a student with an initial password

**What to build:** On the officer's Students page, and only there, an "Add student" header button opens a form on the page with every student field plus a password. Skills are optional comma-separated text; everything else is required. On save the student appears in the table with "Student added: <name>", and can immediately log in with that email and password, whatever capitals or spaces are typed in the email. A duplicate Student ID, email or enrollment number gets a clear 409 error naming the field, and the form keeps what was typed. CGPA must be 0–10 and backlogs 0 or more. Only officers can create students, and no response ever includes a password. Companies and Recruiters pages are unchanged.

Parent: docs/issues/0002-officer-students-page-add-student-and-set-password.md

**Blocked by:** 01 (Backend test setup)

**Status:** done

- [ ] API: officer creates a student → 201, and that student logs in with the given email and password.
- [ ] API: the same student logs in with the email in capitals and with surrounding spaces.
- [ ] API: missing or empty password → 400; CGPA 11 or backlogs −1 → 400.
- [ ] API: duplicate Student ID, email and enrollment number each → 409 with the matching `field`.
- [ ] API: student or recruiter token → 403; no response contains `password`.
- [ ] Manual: add a student from the page, see them in the table, log in as them. A duplicate keeps the form filled. Companies and Recruiters look unchanged.

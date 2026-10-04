# 03: Officer sets a student's password

**What to build:** Each row on the officer's Students page gets a "Set password" button. It opens a form on the page naming the student ("Set password for <name> (<Student ID>)") with one password field, Save and Cancel. Only one form is open at a time, and it closes Add student. On save the officer sees "Password updated for <name>."; the student's old password stops working and the new one works straight away. This also works for older students who never had a password. It is backed by a new student password endpoint that, in this ticket, accepts only officers; students are refused until ticket 06 adds their branch.

Parent: docs/issues/0002-officer-students-page-add-student-and-set-password.md

**Blocked by:** 01 (Backend test setup), 02 (Officer adds a student), because both change the same officer page

**Status:** done

- [ ] API: officer sets a password → 200 with the message; the old password fails to log in and the new one succeeds.
- [ ] API: a student with no stored password can log in after the officer sets one.
- [ ] API: empty password → 400; unknown student → 404; recruiter → 403; student → 403 (for now).
- [ ] Manual: reset from the table and log in with the new password. The form names the right student; Cancel changes nothing.

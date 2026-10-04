# 06: Student changes their own password

**What to build:** An always-visible "Change password" section on the student profile, with Current, New and Confirm password fields. Empty fields show "Required" and a mismatch shows "New passwords do not match." before anything is sent. The server answers:
- "Current password is incorrect." (all three fields are cleared);
- "New password must be different from your current password.";
- on success, "Password changed." with the fields cleared, and the student stays logged in on the page.

Afterwards the new password logs in and the old one doesn't. There is no length rule. This adds the student branch to the password endpoint from ticket 03: a student can change only their own password, and must give the current one.

Parent: docs/issues/0004-student-profile-skills-only-and-change-password.md

**Blocked by:** 03 (Officer sets a student's password), which creates the endpoint; 04 (Students can edit only their skills), because both change the same profile page

**Status:** done

- [ ] API: a student changes their password → 200; the new one logs in and the old one fails; the token used for the change still works.
- [ ] API: wrong current → 400 with the exact message; same as current → 400 with the exact message; a missing field → 400.
- [ ] API: a student targeting another student's ID → 403; ticket 03's officer tests still pass.
- [ ] Manual: each message appears as specified. After a change, log out and log in with the new password.

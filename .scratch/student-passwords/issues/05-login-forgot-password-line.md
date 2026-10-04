# 05: Login page forgot-password line

**What to build:** While the Student role is selected, the login page shows the plain-text line "Forgot your password? Contact your placement officer." under the form, above the demo-credentials note. It hides for Recruiter and Placement Officer, follows role changes, respects `?role=`, and is not a link. Nothing else on the page changes. Tests fix the login contract the officer-set password flow relies on: every failed login gets the same generic message, including a student with no password yet.

Parent: docs/issues/0003-login-page-forgot-password-guidance.md

**Blocked by:** 01 (Backend test setup)

**Status:** done

- [ ] API: wrong password, unknown email, wrong role, and a student with no stored password all → 401 with the identical message "Invalid email, password, or role".
- [ ] API: missing email, password or role → 400.
- [ ] Manual: the line shows for Student and hides for Recruiter and Placement Officer. It follows role changes, is hidden when arriving via `/login?role=recruiter`, and is plain text.

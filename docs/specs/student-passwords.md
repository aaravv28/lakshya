# Student passwords & profile edit rights

Status: decided, ready to build. Scope: **students only**, for the semester **demo** (no expiry, no rate limits, no email).

## Summary

There is **no Activate Account page**. The placement officer creates each student with a password they type in, and passes it on to the student outside the app. The student logs in with it normally. Changing it is optional, from their profile. A forgotten password is replaced by the officer.

Students may edit only their **skills**; every other profile field is officer-controlled.

## 1. Officer: Add student

On the officer's **Students** page, add an **"Add student"** button that opens a form.

| Field | Required | Notes |
|---|---|---|
| Full name | yes | |
| Email | yes | unique; stored trimmed and lowercased (login already lowercases its input, so a mixed-case stored email could never log in) |
| Enrollment no. | yes | unique; the student's only ID, stored in capitals; cannot be changed later |
| Department | yes | |
| Semester | yes | number |
| CGPA | yes | 0–10 |
| Backlogs | yes | ≥ 0 |
| Skills | no | |
| Password | yes | any non-empty value, no minimum length |

- On success: the form closes, the new student appears in the table, and a message confirms it.
- On a duplicate email or enrollment number: show which field is already in use; keep the form filled in.
- The password is stored hashed and can **never be shown again**, not even to the officer.

## 2. Officer: Set password (forgotten passwords)

Each row in the officer's Students table gets a **"Set password"** button.

- Opens a small dialog: **New password** (non-empty, no minimum length).
- On success: "Password updated for <name>." The old password stops working immediately.
- The officer never sees the old password, only replaces it.
- The student is not notified in-app; the officer tells them.

## 3. Login page

- No change to how login works.
- Add one line under the form: *"Forgot your password? Contact your placement officer."* No link, no reset flow.
- A student created before this change without a password still gets the normal "Invalid email, password, or role" error until the officer uses **Set password**.

## 4. Student profile: Change password (optional)

A **"Change password"** section on the student's profile page.

Fields: **Current password**, **New password**, **Confirm new password**.

| Situation | Result |
|---|---|
| Current password wrong | "Current password is incorrect." |
| New ≠ confirm | "New passwords do not match." |
| New = current | "New password must be different from your current password." |
| Any field empty | field-level "Required" |
| Success | "Password changed." Fields clear; the student **stays logged in** on the profile page. |

No minimum length.

## 5. Student profile: edit rights

- A student can edit **only their skills**.
- Name, email, enrollment no., department, semester, CGPA and backlogs are shown **read-only** on the profile.
- The backend enforces this too: a student's profile update that includes any field other than `skills` is **rejected** with an error naming the disallowed fields, and hiding them in the form is not the only guard.
- The officer keeps full edit rights on these fields through the API. An officer edit screen is not part of this spec.

## 6. Where a password can change

Only two paths, both dedicated:

1. The student's **Change password** (requires the current password).
2. The officer's **Add student** / **Set password**.

The generic student update (`PUT /students/:studentId`) must **no longer accept `password`** from anyone. Today it passes the request body straight through, which lets a student skip the current-password check and also edit their own CGPA/backlogs.

## Out of scope

- Activate Account page, email/OTP verification, self-service forgot-password.
- Password expiry, strength rules, login rate limiting (demo only).
- Recruiter and placement-officer passwords.
- An officer screen for editing existing student details.

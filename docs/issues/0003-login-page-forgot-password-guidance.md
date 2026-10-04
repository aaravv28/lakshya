---
title: "Login page: forgot-password guidance and login rules for officer-set passwords"
labels: [done]
status: closed
parent: docs/issues/0001-student-passwords-no-activate-page.md
decision-record: docs/specs/student-passwords.md
---

## Problem Statement

Students now get their first password from the placement officer and never go through an activation step. The login page doesn't reflect that. A student who forgets their password sees only "Invalid email, password, or role" and has no idea what to do next: there's no reset link, and there shouldn't be one, because the only way back in is to ask the placement officer.

Students also type their college email in different ways (capital letters, trailing spaces from copy-paste). The officer's password only helps if those variations still log in.

## Solution

The login page stays as it is (role picker, email, password, sign in), with one addition. While the **Student** role is selected, a line under the form reads:

> Forgot your password? Contact your placement officer.

It is plain text, not a link. There is still no register, activate or reset option anywhere on the page.

The existing login behaviour is also written down here as the contract the other pieces of this work depend on:
- Email is matched regardless of capitals and surrounding spaces.
- A student whose record has no password yet gets the same generic error as a wrong password, until the officer sets one.
- After the officer resets a password, or the student changes it, only the newest password works.

## User Stories

1. As a student, I want to log in with the email and password my placement officer gave me, so that I can start using the portal straight away.
2. As a student, I want to go straight to my dashboard after logging in, with no activation step, so that getting started is simple.
3. As a student, I want my email accepted whatever capitals I type, so that "24ITUOZ009@DDU.AC.IN" works the same as the lowercase form.
4. As a student, I want spaces before or after my email ignored, so that a copy-pasted email still works.
5. As a student, I want the Student role pre-selected when I arrive from the landing page's student card, so that I don't have to pick it.
6. As a student, I want Student to be the default role when I open the login page directly, so that the most common case needs no extra step.
7. As a student, I want to see "Forgot your password? Contact your placement officer." under the form, so that I know how to get back in.
8. As a student, I want that line to be plain text rather than a link, so that I'm not sent to a reset page that doesn't exist.
9. As a student, I want no "Register" or "Activate account" option, so that I'm not confused into thinking I should create my own account.
10. As a student, I want a single generic "Invalid email, password, or role" message when login fails, so that the page doesn't reveal whether an email is registered.
11. As a student whose record was created before passwords were set, I want the same generic message until my officer sets a password, so that the behaviour is consistent.
12. As a student, I want my new password to work straight after I change it on my profile, so that changing it doesn't lock me out.
13. As a student, I want my old password to stop working after I change it, so that the change actually protects me.
14. As a student, I want the password my officer just set to work immediately after a reset, so that I can get back in the same day.
15. As a student, I want the sign-in button to show "Signing in…" and be disabled while it's working, so that I don't submit twice.
16. As a student who is already logged in, I want to be sent to my dashboard if I open the login page, so that I don't log in twice.
17. As a recruiter, I want the forgot-password line hidden when Recruiter is selected, so that I'm not told to contact a placement officer about an account they don't manage in this feature.
18. As a placement officer, I want the forgot-password line hidden when Placement Officer is selected, so that I'm not told to contact myself.
19. As any user, I want the line to appear or disappear as soon as I change the role, so that it always matches the role I've chosen.
20. As a placement officer, I want students to be told to come to me for forgotten passwords, so that resets go through the Set password action I control.
21. As a developer, I want the existing demo-credentials note left unchanged, so that the development setup is still documented on the page.

## Implementation Decisions

**Login page (frontend)**
- Add one line of guidance text, "Forgot your password? Contact your placement officer.", shown **only while the Student role is selected** and hidden for Recruiter and Placement Officer. It updates as soon as the role picker changes.
- Placement: directly under the form, above the existing demo-credentials note. Style it like the existing auth note text; no new visual component.
- Not a link, no click behaviour, no new route.
- Everything else is unchanged: role from the `?role=` query (default Student), fields, loading state, error display (the server's message shown as-is), redirect after login, redirect when already logged in, and the demo-credentials note.
- No "Register", "Activate account" or "Reset password" links are added.

**Login API (`POST /api/auth/login`): contract to keep, one hardening**
- Already true, must stay true: the email is trimmed and lowercased before lookup; a missing account, a record with no password, a wrong password and a wrong role all return **401** with the same message, "Invalid email, password, or role"; missing fields return 400.
- Hardening: the stored student email must also be lowercase, or the lowercased lookup can never match. That is enforced where students are created and updated (model-level lowercase and trim, delivered in sub-issue 0002 and the parent issue), not in login. The login tests below lock it in.
- No change to the token, its expiry, or the response shape.

## Testing Decisions

**What makes a good test.** Behaviour only: HTTP requests in, status and body out. A test proves "this email and password can log in" by calling the login endpoint, never by reading hashes or database fields.

**The backend seam: the HTTP API**, the same single seam confirmed for issues 0001 and 0002. The exported Express app is tested with supertest against a temporary in-memory MongoDB. Setup (splitting the app from server startup, the test runner, `npm test`) is done by whichever issue lands first.

**Login cases**
- Officer-created student logs in with the exact email and password → 200 with a token and a student role.
- Same student, email in capitals and with surrounding spaces → 200.
- Wrong password, unknown email, wrong role, and a record with no password → all 401 with the identical message.
- Missing email, password or role → 400.
- After an officer password reset: old password → 401, new one → 200. After a student changes their own password: the same. These overlap with 0001/0002 and may live there; they must exist somewhere.

**The login page's guidance line has no automated test.** The frontend has no test setup, and adding one for a single line of conditional text would be a second seam for very little value. Check it by hand:
- open the login page, and with Student selected the line shows;
- switch to Recruiter, then Placement Officer: it hides;
- switch back: it shows;
- arrive via `/login?role=recruiter`: it's hidden initially;
- it's plain text, not a link.

**Prior art:** none; the repo has no tests yet.

## Out of Scope

- Any self-service password reset: links, emails, OTPs or security questions.
- Register or Activate Account pages or links.
- Forgot-password guidance for recruiters and placement officers.
- Login rate limiting, lockout after failed attempts, "remember me", or password visibility toggles.
- Changing how the session is stored (still browser local storage for the demo).
- Redesigning the login page's layout or copy beyond the one added line.

## Further Notes

- This slice is tiny on the frontend. Its main value is fixing the login contract the other two issues rely on (case-insensitive email, identical error messages, newest password wins) and making sure it's tested.
- Showing the line for Students only is a call made while writing this spec. It follows from recruiter and officer passwords being out of scope. If you'd rather show it for every role, it's a one-condition change.

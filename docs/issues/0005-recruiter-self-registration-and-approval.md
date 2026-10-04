---
title: Recruiter self-registration and placement officer approval
labels: [done]
status: closed
glossary: CONTEXT.md
---

## Problem Statement

A recruiter who is new to Lakshya can't join on their own. Today only the placement officer can create recruiters and companies, by typing them in themselves, so every new company needs the placement officer's time before it can even start. There is also no checkpoint between "someone says they recruit for a company" and "students see that company's jobs": the recruiter records carry a `verified` flag that nothing checks, and recruiters can currently post jobs for any company.

## Solution

A new recruiter registers from the website with their own details and their company's details, then logs in. Before approval they can fill out their company and add jobs (roles), then **submit a company registration**. The placement officer sees it on a **Pending** page: the recruiter, the company and every job submitted. The placement officer **approves** it, and everything goes live to students, or **rejects** it with a reason, so the recruiter can fix it and submit again.

Once approved, the registration is permanent. Nobody edits or removes the company, the recruiter or their jobs. The recruiter can still add new jobs, which go live immediately. Each company has exactly one recruiter, and two companies can never share a name.

## User Stories

**Registering**
1. As a new recruiter, I want a "Register" link from the recruiter login, so that I can join Lakshya without contacting the placement office.
2. As a new recruiter, I want to enter my name, email, phone, designation and password, so that I have an account.
3. As a new recruiter, I want to enter my company's name, industry, website and description, so that the placement officer and students know who we are.
4. As a new recruiter, I want the logo to be optional, so that I can register without one.
5. As a new recruiter, I want to be told "This company is already registered on Lakshya." if my company's name matches one already on Lakshya (ignoring capitals and spaces), so that I don't create a duplicate.
6. As a new recruiter, I want to be told if my email is already registered, so that I know to log in instead.
7. As a new recruiter, I want every required field checked with a clear message, so that I can fix mistakes before submitting.
8. As a new recruiter, I want to land on the login page with a "Registered. Log in to continue." message, so that I know it worked.
9. As a new recruiter, I want to log in straight after registering, before any approval, so that I can finish setting up.

**Before approval**
10. As an unapproved recruiter, I want a banner telling me my status (not submitted yet / waiting for the placement officer / rejected, with the reason), so that I always know where I stand.
11. As an unapproved recruiter, I want only Dashboard, Company and Jobs in my menu, so that I'm not shown screens I can't use yet.
12. As an unapproved recruiter, I want to edit my company details and my own details, so that I can fix them before submitting.
13. As an unapproved recruiter, I want to add, edit and delete jobs, so that I can prepare my roles.
14. As an unapproved recruiter, I want to submit my company registration with or without jobs, so that I can get approved first and post roles later.
15. As an unapproved recruiter, I want everything locked but still visible while it waits for the placement officer, so that I can see what I sent.
16. As a rejected recruiter, I want to see the rejection reason, edit anything and resubmit, so that I can get approved.

**Placement officer**
17. As a placement officer, I want a "Pending" item in my menu with a count of waiting registrations, so that I notice new ones.
18. As a placement officer, I want a list of pending registrations with company name, recruiter name, number of jobs and submitted date, so that I can pick one.
19. As a placement officer, I want to open a registration and see the recruiter's details, including phone, so that I can check the person is real.
20. As a placement officer, I want to see the company details, so that I can check the company.
21. As a placement officer, I want to see every job submitted with its full details, so that I can check the roles.
22. As a placement officer, I want to approve a registration in one click, so that the company, recruiter and jobs go live together.
23. As a placement officer, I want to reject with a required reason, so that the recruiter knows what to fix.
24. As a placement officer, I want an approved or rejected registration to leave the Pending list, so that it shows only what needs me.
25. As a placement officer, I want the Recruiters and Companies pages to show only approved ones, so that directories stay clean.

**After approval**
26. As an approved recruiter, I want my full menu (Dashboard, Company, Jobs, Applicants, Interviews), so that I can hire.
27. As an approved recruiter, I want to add a new job that goes live immediately, so that I don't wait for approval each time.
28. As an approved recruiter, I want to be told my company, my details and my existing jobs can't be changed, so that I'm not surprised when there's no Edit button.
29. As a student, I want to see only approved companies and their jobs, so that I only apply to vetted employers.
30. As a student, I want a job to stop taking applications after its deadline, so that I don't apply to closed roles.
31. As a student, I want to be refused if I try to apply to a job that isn't approved, so that a hidden job can't be applied to by its address.
32. As a recruiter, I want to be able to post jobs only for my own company, so that nobody can post as another company.
33. As a placement officer, I want the existing Google, Netflix and Amazon recruiters, companies and jobs to count as approved, so that nothing disappears from students.
34. As a placement officer, I understand I can no longer add, edit or remove recruiters or companies myself, so that registration is the only way in and approved records stay permanent.

## Implementation Decisions

**Vocabulary** follows CONTEXT.md: company registration, submit, approve, reject, rejection reason, job (a.k.a. role).

**Registration status lives on the recruiter** (one recruiter per company, so the company's visibility follows its recruiter's status):
- `Draft`: registered, not yet submitted. Everything is editable.
- `Pending`: submitted and locked, waiting for the placement officer.
- `Rejected`: has a `rejectionReason`; editable again; can resubmit (→ Pending).
- `Approved`: final. Company, recruiter and existing jobs are read-only for everyone.
- This replaces the unused `verified` flag. It also records `submittedAt` and `reviewedAt`, and the reviewing officer in the existing `officerId`.

**Schema changes**
- Recruiter: add required `phone`, `registrationStatus` (enum above), optional `rejectionReason`, `submittedAt` and `reviewedAt`. `officerId` becomes optional (set on review). Email is unique, stored trimmed and lowercased.
- Company: `logoUrl` becomes optional. Add a unique **name key** (name trimmed, inner spaces collapsed, lowercased) so duplicate names are refused by the database, not only by the form.
- Job: `approvedByOfficerId` becomes optional. It is set to the approving officer for jobs approved with the registration, and to the same officer for jobs added after approval.
- IDs for new recruiters, companies and jobs are generated by the server. Clients never send them.

**API** (all behind login except registration)
- `POST /api/auth/register-recruiter` (public): recruiter plus company details. Creates the recruiter (`Draft`) and company together, or neither. Duplicate company name → 409 "This company is already registered on Lakshya." with `field: "companyName"`. Duplicate email → 409 naming `recruiterEmail`. Response has no password.
- Recruiter's own registration: read my registration (status, reason, company, jobs); edit my details and company (only `Draft`/`Rejected`); **submit** (`Draft`/`Rejected` → `Pending`; clears the old reason).
- Jobs: a recruiter can create jobs **only for their own company** (the server sets `companyId`). They can edit or delete jobs only while `Draft`/`Rejected`. A job added while `Approved` is live immediately. Editing or deleting any job of an approved recruiter → 409 "Approved jobs can't be changed". Creating while `Pending` → 409.
- Placement officer: list pending registrations (with counts), read one, **approve** (`Pending` → `Approved`), **reject** with non-empty `reason` (`Pending` → `Rejected`). Acting on a registration that isn't pending → 409.
- **Removed:** officer create/edit/delete of recruiters; officer create/edit/delete of companies (creation happens only via registration). Recruiter edits of approved records.
- **Visibility:** students (and other recruiters) get only approved companies, recruiters and jobs from every list and detail endpoint; an unapproved one is a 404. Applying to an unapproved job → 404. Applying after the job's deadline → 400. The placement officer sees everything. A recruiter always sees their own.

**Frontend**
- Login page: "New to Lakshya? Register as a recruiter" link when the Recruiter role is selected.
- A public recruiter registration page with two sections (Your details, Your company), and a field-level message for 409s.
- Recruiter area: status banner on every page. Menu limited to Dashboard/Company/Jobs until approved. The Company page is editable in `Draft`/`Rejected` and read-only otherwise. The Jobs page adds, edits and deletes in `Draft`/`Rejected`, and only adds in `Approved`. A "Submit for approval" button is shown in `Draft`/`Rejected`.
- Officer area: "Pending (n)" menu item, a pending list, a registration detail page with Approve and Reject (a reason box is required before Reject is enabled). The Recruiters and Companies pages lose any add/edit/delete controls.

**Existing data:** a one-off script (dry run by default, `--apply` to change) marks every existing recruiter `Approved`, fills the company name key, and stops if two existing companies share a name.

## Testing Decisions

- **Seam: the backend HTTP API only,** the same single seam used for student passwords. Tests use supertest against the exported app and an in-memory MongoDB, drive everything through requests with real tokens, and check statuses, bodies and what other roles can then see. No database peeking.
- **Covered:**
  - registration: happy path; duplicate name ignoring case and spaces; duplicate email; no password in the response;
  - login before approval;
  - the draft → pending → rejected → pending → approved lifecycle, and the illegal transitions;
  - job rules per status, and own-company only;
  - freeze after approval, including for the officer;
  - visibility for student vs officer vs owner;
  - apply rules (unapproved, past deadline);
  - removed officer endpoints return 404/405;
  - the migration script, rehearsed on an in-memory database.
- **Prior art:** `backend/test/*` and `helpers.js` from the student-passwords work.
- **Frontend:** checked by hand. There's no frontend test setup, and adding one isn't part of this.

## Out of Scope

- Notifying the recruiter (email or in-app) about approval or rejection. They see the result in the banner on next login.
- More than one recruiter per company, or picking an existing company.
- Editing or removing anything after approval, by anyone, including closing a job early.
- Flagging similar-but-different company names ("Google India").
- Email verification of the recruiter's address.
- Recruiter password change or reset.

## Further Notes

- Student-passwords work (docs/issues/0001–0004) set the pattern followed here: IDs server-generated, 409 with `field` for clashes, tests at the HTTP API.
- Recruiter job visibility today isn't limited to their own company. This work fixes that as part of "own company only".

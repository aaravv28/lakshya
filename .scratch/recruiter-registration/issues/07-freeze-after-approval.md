# 07: Freeze after approval

**What to build:** An approved recruiter gets the full menu (Dashboard, Company, Jobs, Applicants, Interviews). They can add new jobs, which go live immediately and are recorded as approved by the officer who approved their registration. Their company, their own details and every existing job are read-only for everyone, officer included; the pages say so instead of offering Edit. The placement officer can no longer add, edit or remove recruiters or companies: those controls and endpoints are gone.

Parent: docs/issues/0005-recruiter-self-registration-and-approval.md

**Blocked by:** 05 (Placement officer reviews pending registrations)

**Status:** done

- [ ] API: an approved recruiter adds a job → 201, and it's visible to students at once.
- [ ] API: editing or deleting an approved recruiter's job, details or company → 409 ("Approved jobs can't be changed", or similar), by the recruiter or the officer.
- [ ] API: the officer's create/edit/delete recruiter and company endpoints no longer exist (404).
- [ ] Manual: full menu after approval; no Edit or Delete on approved items; the officer's Recruiters and Companies pages are read-only.

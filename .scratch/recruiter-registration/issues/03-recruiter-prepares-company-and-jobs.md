# 03: Recruiter prepares their company and jobs

**What to build:** A recruiter who hasn't submitted yet (Draft) sees a status banner ("Not submitted yet"), with a menu limited to Dashboard, Company and Jobs. On the Company page they can edit their own details and their company's details. Duplicate company names are still refused. On the Jobs page they can add, edit and delete jobs. A job is always created for their own company: the server sets the company and generates the job ID. None of this is visible to students yet.

Parent: docs/issues/0005-recruiter-self-registration-and-approval.md

**Blocked by:** 02 (Recruiter registers and logs in)

**Status:** done

- [ ] API: a Draft recruiter reads their registration (status, company, jobs), edits their details and company, and adds, edits and deletes jobs.
- [ ] API: renaming the company to an existing name → 409; a job posted with another company's ID still lands on the recruiter's own company; editing another recruiter's job → 403.
- [ ] Manual: banner and limited menu shown; Applicants and Interviews are not reachable.

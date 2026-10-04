# 06: Students see only approved companies and jobs

**What to build:** Students, and recruiters other than the owner, only ever see approved companies, recruiters and jobs, in every list and detail. An unapproved one is "not found" even by typing its address. Applying to an unapproved job is refused as not found, and applying after a job's deadline is refused. The placement officer still sees everything, and a recruiter always sees their own company and jobs. The officer's Recruiters and Companies pages list approved ones only.

Parent: docs/issues/0005-recruiter-self-registration-and-approval.md

**Blocked by:** 02 (Recruiter registers and logs in)

**Status:** done

- [ ] API: a Draft recruiter's company and jobs are absent from the student lists and 404 by ID; the eligibility check for them → 404.
- [ ] API: a student applying to an unapproved job → 404; to an approved job past its deadline → 400; to an approved open job → 201.
- [ ] API: the officer and the owning recruiter still read the unapproved records.
- [ ] Manual: existing Google/Netflix/Amazon jobs still show for students.

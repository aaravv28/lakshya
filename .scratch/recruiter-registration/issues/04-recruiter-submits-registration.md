# 04: Recruiter submits their company registration

**What to build:** A Draft or Rejected recruiter presses "Submit for approval", with or without jobs. The registration becomes Pending, any old rejection reason is cleared, and the submission date is recorded. While Pending, everything stays visible but is locked: no editing details, company or jobs, and no adding or deleting jobs. The banner says it's waiting for the placement officer.

Parent: docs/issues/0005-recruiter-self-registration-and-approval.md

**Blocked by:** 03 (Recruiter prepares their company and jobs)

**Status:** done

- [ ] API: submitting from Draft → Pending, with zero jobs allowed; submitting again while Pending → 409.
- [ ] API: while Pending, editing details or company, or adding, editing or deleting a job → 409; nothing changes.
- [ ] Manual: Submit button shown only in Draft/Rejected; fields and job controls disabled while Pending; banner text correct.

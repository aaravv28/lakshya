# 05: Placement officer reviews pending registrations

**What to build:** The placement officer's menu shows "Pending (n)". The Pending page lists waiting registrations with company name, recruiter name, number of jobs and submitted date. Opening one shows:
- the recruiter's details, including phone;
- the company's details;
- every submitted job in full.

**Approve** makes the registration Approved, records the officer and the date, and marks its jobs approved by that officer. **Reject** requires a reason and makes it Rejected. Either way it leaves the list. A rejected recruiter sees the reason in their banner, can edit again (as in ticket 03) and can resubmit (as in ticket 04).

Parent: docs/issues/0005-recruiter-self-registration-and-approval.md

**Blocked by:** 04 (Recruiter submits their company registration)

**Status:** done

- [ ] API: the officer lists only Pending registrations, with counts, and reads one in full.
- [ ] API: approve → Approved, and the jobs carry the approving officer; reject without a reason → 400; reject with a reason → Rejected, and the recruiter reads that reason.
- [ ] API: approving or rejecting a non-pending registration → 409; a recruiter or student calling these → 403.
- [ ] API: rejected → edit → resubmit → Pending again, with the reason cleared.
- [ ] Manual: count in the menu; Reject disabled until a reason is typed; the item disappears after a decision.

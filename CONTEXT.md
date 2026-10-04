# Lakshya

Campus placement platform connecting students, recruiters and the placement officer.

## Language

**Student**:
A person seeking placement, identified by their enrollment number.
_Avoid_: user, candidate (except in recruiter-facing copy)

**Placement officer**:
The college staff member who manages students and approves recruiters and companies.
_Avoid_: admin, officer (alone, in written specs)

**Recruiter**:
A person who hires on behalf of one company.
_Avoid_: employer, HR

**Company**:
An organisation that hires through Lakshya. A company has exactly one recruiter and can have many jobs.

**Industry**:
The one field of work a company says it is in, chosen from Lakshya's fixed list (for example Software Development, Banking & Finance, Automobile, or Other). Never typed freely.
_Avoid_: sector, domain

**Job**:
One role a company is hiring for, with its own package, deadline and eligibility rules. Recruiters may say "role"; it means the same thing.
_Avoid_: opening, posting, vacancy

**Department**:
One of the fixed academic departments Lakshya serves: Computer Engineering, Information Technology, Electronics & Communication, Electrical, Mechanical, Civil, Chemical, and Instrumentation & Control. Always written by its full name and chosen from this list, never typed freely.
_Avoid_: branch, short codes (CE, IT)

**Company registration**:
A recruiter's request to hire through Lakshya: the recruiter, their company and the jobs they submit with it. The placement officer approves or rejects it once. Once approved it is final: the company's and recruiter's details can no longer be edited, and the recruiter's new jobs go live without further approval.
_Avoid_: signup request, verification

**Registration status**:
Where a company registration is: **Draft** (registered, not yet submitted; editable), **Pending** (submitted; locked while the placement officer reviews it), **Rejected** (sent back with a rejection reason; editable again and can be resubmitted) or **Approved** (live to students and permanent).

**Rejection reason**:
The explanation the placement officer must give when rejecting a company registration. The recruiter sees it and may fix and resubmit.

## Relationships

- A **Company** has exactly one **Recruiter** and many **Jobs**, and is in exactly one **Industry**.
- A **Recruiter** belongs to exactly one **Company** and has at most one open **Company registration**.
- A **Company registration** covers one **Recruiter**, one **Company** and the **Jobs** submitted with it.
- Nothing from a **Company registration** is visible to **Students** until the **Placement officer** approves it.
- Two **Companies** never share a name (ignoring capitals and extra spaces).
- Once approved, a **Company**, its **Recruiter** and its **Jobs** are never edited or removed. A **Job** stops taking applications when its deadline passes.
- After approval, a **Recruiter** can still add new **Jobs**; they go live immediately.
- Every **Student** belongs to exactly one **Department**, set when the **Placement officer** adds them and never changed afterwards.
- A **Job** is open to one or more **Departments**.

## Example dialogue

> **Placement officer:** "A new **company registration** came in from a Flipkart **recruiter** with three **jobs**."
> **Placement officer:** "If I approve, the company, the recruiter and all three jobs go live. If I reject, I have to give a **rejection reason**, and they can fix it and resubmit."

## Flagged ambiguities

- "Role" and "job" were used interchangeably. Resolved: they are the same thing; the canonical term is **Job**.
- "Confirm" was used both for the recruiter sending their details and for the officer accepting them. Resolved: the recruiter **submits** a company registration; the placement officer **approves** or **rejects** it.
- "Pick an existing company" was considered and dropped: two recruiters never represent the same company, so every company registration brings its own company.
- Removing a recruiter (with their company and jobs) was considered and dropped: approved records are permanent.
- Departments were written inconsistently ("COMPUTER ENGINEERING", "Computer engineering", "CE"). Resolved: a **Department** is always its full name from the fixed list.

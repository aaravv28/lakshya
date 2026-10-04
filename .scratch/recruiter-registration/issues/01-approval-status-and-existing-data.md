# 01: Approval status and existing-data script

**What to build:** Recruiters gain a company-registration status (Draft, Pending, Rejected, Approved) with an optional rejection reason, submitted/reviewed dates and a required phone number. This replaces the unused `verified` flag. Companies gain a name key (trimmed, inner spaces collapsed, lowercased) that the database keeps unique, and the logo becomes optional. A one-off script (dry run by default, `--apply` to change) marks every existing recruiter Approved, fills in company name keys, and stops if two existing companies share a name. Nothing students see changes.

Parent: docs/issues/0005-recruiter-self-registration-and-approval.md

**Blocked by:** None (can start immediately)

**Status:** done

- [ ] API: existing recruiters read back with status Approved; recruiter responses never include a password.
- [ ] Script, rehearsed on an in-memory database: marks recruiters Approved, fills name keys, refuses on a duplicate name, and a second run changes nothing.
- [ ] Script dry run against the real database shows the 3 recruiters and 3 companies; `--apply` is run only with the user's go-ahead.
- [ ] All existing backend tests still pass.

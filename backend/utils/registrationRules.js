// What a recruiter may change, depending on where their company registration is.
//
//   Draft ──submit──▶ Pending ──approve──▶ Approved
//     ▲                 │
//     └──── Rejected ◀──┘ reject (with a reason); edit and submit again
//
// Before submitting (or after a rejection) everything can be edited. While Pending, everything is locked.
// Once Approved, nothing is ever edited again, but new jobs can still be added and go live at once.

const EDITABLE_STATUSES = ["Draft", "Rejected"];

const canEditRegistration = (status) => EDITABLE_STATUSES.includes(status);

const canAddJob = (status) => canEditRegistration(status) || status === "Approved";

const PENDING_MESSAGE = "Your company registration is waiting for the placement officer, so it can't be changed.";

const lockedMessage = (status) => (status === "Approved" ? "Approved registrations can't be changed." : PENDING_MESSAGE);

const jobLockedMessage = (status) => (status === "Approved" ? "Approved jobs can't be changed." : PENDING_MESSAGE);

module.exports = { canEditRegistration, canAddJob, lockedMessage, jobLockedMessage };

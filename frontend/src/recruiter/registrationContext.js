import { createContext } from 'react'

// The logged-in recruiter's company registration: their details, company, jobs and status.
export const RegistrationContext = createContext(null)

// A recruiter can change their details, company and jobs only before submitting, or after a rejection.
export const EDITABLE_STATUSES = ['Draft', 'Rejected']

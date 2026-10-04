import { useContext } from 'react'
import { EDITABLE_STATUSES, RegistrationContext } from './registrationContext'

export function useRecruiterRegistration() {
  const context = useContext(RegistrationContext)
  const status = context?.registration?.recruiter?.registrationStatus
  return { ...context, status, approved: status === 'Approved', editable: EDITABLE_STATUSES.includes(status) }
}

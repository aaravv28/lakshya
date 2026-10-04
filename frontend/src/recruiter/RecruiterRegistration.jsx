import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api, endpoints } from '../services/api'
import { RegistrationContext } from './registrationContext'
import { useRecruiterRegistration } from './useRecruiterRegistration'

export function RecruiterRegistrationProvider({ children }) {
  const [state, setState] = useState({ registration: null, loading: true, error: '' })

  const load = useCallback(() => api.get(endpoints.registration)
    .then((registration) => setState({ registration, loading: false, error: '' }))
    .catch((error) => setState({ registration: null, loading: false, error: error.message })), [])

  useEffect(() => { load() }, [load])

  return <RegistrationContext.Provider value={{ ...state, reload: load }}>{children}</RegistrationContext.Provider>
}

// Applicants and Interviews only make sense once the placement officer has approved the registration.
export function ApprovedRecruiterOnly({ children }) {
  const { loading, approved } = useRecruiterRegistration()
  if (loading) return null
  return approved ? children : <Navigate to="/recruiter/dashboard" replace />
}

const bannerText = {
  Draft: ['Not submitted yet', 'Fill in your company and jobs, then submit them to the placement officer for approval. Students can’t see anything until it’s approved.'],
  Pending: ['Waiting for the placement officer', 'Your company registration is being reviewed. It’s locked until the placement officer approves or rejects it.'],
  Rejected: ['Rejected by the placement officer', 'Fix what the placement officer asked for, then submit again.'],
}

export function RegistrationBanner() {
  const { registration, status, editable, reload } = useRecruiterRegistration()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  if (!registration || !bannerText[status]) return null
  const [title, text] = bannerText[status]
  const jobCount = registration.jobs.length
  const submit = async () => {
    const confirmation = `Submit ${registration.company.companyName} with ${jobCount} job${jobCount === 1 ? '' : 's'} to the placement officer? You can’t change anything while it’s being reviewed.`
    if (!window.confirm(confirmation)) return
    setError('')
    setSubmitting(true)
    try {
      await api.post(`${endpoints.registration}/submit`)
      await reload()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }
  return <div className={`registration-banner ${status.toLowerCase()}`} role="status">
    <strong>{title}</strong>
    <p>{text}</p>
    {status === 'Rejected' && registration.recruiter.rejectionReason && <p><b>Reason:</b> {registration.recruiter.rejectionReason}</p>}
    {error && <p className="error-state">{error}</p>}
    {editable && <button className="button button-dark" onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : status === 'Rejected' ? 'Submit again' : 'Submit for approval'}</button>}
  </div>
}

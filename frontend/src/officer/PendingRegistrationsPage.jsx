import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, endpoints } from '../services/api'
import { formatCurrency, formatDate } from '../config/appConfig'
import { DetailRow, EmptyState, ErrorState, LoadingState, PageHeader, SectionHeading } from '../components/common'

function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const load = useCallback(() => api.get(path)
    .then((data) => setState({ data, loading: false, error: '' }))
    .catch((error) => setState({ data: null, loading: false, error: error.message })), [path])
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

export function PendingRegistrationsPage() {
  const pending = useApi(`${endpoints.registration}/pending`)
  if (pending.loading) return <LoadingState />
  if (pending.error) return <ErrorState message={pending.error} onRetry={pending.reload} />
  return <>
    <PageHeader eyebrow="Placement office" title="Pending company registrations" description="New recruiters and their companies waiting for your approval. Nothing here is visible to students yet." />
    {pending.data.length === 0
      ? <EmptyState title="Nothing waiting" message="New company registrations will appear here when recruiters submit them." />
      : <div className="table-wrap"><table><thead><tr><th>Company</th><th>Recruiter</th><th>Jobs</th><th>Submitted</th><th></th></tr></thead><tbody>{pending.data.map(({ recruiter, company, jobCount }) => <tr key={recruiter.recruiterId}>
        <td><strong>{company?.companyName}</strong><small>{company?.industry}</small></td>
        <td><strong>{recruiter.recruiterName}</strong><small>{recruiter.designation}</small></td>
        <td>{jobCount}</td>
        <td>{formatDate(recruiter.submittedAt)}</td>
        <td><Link to={`/officer/pending/${recruiter.recruiterId}`}>Review →</Link></td>
      </tr>)}</tbody></table></div>}
  </>
}

export function ReviewRegistrationPage() {
  const { recruiterId } = useParams()
  const navigate = useNavigate()
  const registration = useApi(`${endpoints.registration}/${recruiterId}`)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [deciding, setDeciding] = useState(false)
  if (registration.loading) return <LoadingState />
  if (registration.error) return <ErrorState message={registration.error} onRetry={registration.reload} />
  const { recruiter, company, jobs } = registration.data
  const pending = recruiter.registrationStatus === 'Pending'
  const decide = async (decision) => {
    setError('')
    setDeciding(true)
    try {
      await api.post(`${endpoints.registration}/${recruiterId}/${decision}`, decision === 'reject' ? { reason } : {})
      navigate('/officer/pending', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
      setDeciding(false)
    }
  }
  return <>
    <Link className="back-link" to="/officer/pending">← All pending registrations</Link>
    <PageHeader eyebrow={pending ? 'Waiting for your review' : `Company registration · ${recruiter.registrationStatus}`} title={company.companyName} description={company.description} />
    <section className="surface">
      <SectionHeading title="Recruiter" />
      <div className="detail-grid">
        <DetailRow label="Name" value={recruiter.recruiterName} />
        <DetailRow label="Designation" value={recruiter.designation} />
        <DetailRow label="Email" value={recruiter.recruiterEmail} />
        <DetailRow label="Phone" value={recruiter.phone} />
        <DetailRow label="Submitted" value={formatDate(recruiter.submittedAt)} />
      </div>
    </section>
    <section className="surface">
      <SectionHeading title="Company" />
      <div className="detail-grid">
        <DetailRow label="Industry" value={company.industry} />
        <DetailRow label="Website" value={company.website} />
        <DetailRow label="Logo" value={company.logoUrl || '—'} />
      </div>
    </section>
    <section className="surface">
      <SectionHeading title={`Jobs (${jobs.length})`} />
      {jobs.length === 0
        ? <p className="muted">No jobs submitted yet. Once approved, jobs this recruiter adds go live straight away.</p>
        : jobs.map((job) => <article className="description-block" key={job.jobId}>
          <h3>{job.jobTitle} <small>· {job.jobType}</small></h3>
          <div className="detail-grid">
            <DetailRow label="Package" value={formatCurrency(job.package)} />
            <DetailRow label="Deadline" value={formatDate(job.deadline)} />
            <DetailRow label="Min CGPA" value={job.minCgpa} />
            <DetailRow label="Max backlogs" value={job.maxBacklogs} />
            <DetailRow label="Departments" value={job.allowedDepartments?.join(', ')} />
          </div>
          <p>{job.jobDescription}</p>
        </article>)}
    </section>
    {pending && <section className="surface form-grid">
      <SectionHeading title="Decision" />
      <p className="muted full-field">Approving makes the company, the recruiter and every job above visible to students. Approved registrations can never be changed.</p>
      <label className="field full-field"><span>Rejection reason (required to reject)</span><textarea rows="3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell the recruiter what to fix" /></label>
      {error && <div className="error-state full-field">{error}</div>}
      <button className="button button-dark" onClick={() => decide('approve')} disabled={deciding}>Approve</button>
      <button className="button button-light" onClick={() => decide('reject')} disabled={deciding || !reason.trim()}>Reject</button>
    </section>}
  </>
}

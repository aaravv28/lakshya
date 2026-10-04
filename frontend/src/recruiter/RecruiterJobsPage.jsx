import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, endpoints } from '../services/api'
import { DEPARTMENTS, formatCurrency, formatDate } from '../config/appConfig'
import { EmptyState, ErrorState, Field, LoadingState, PageHeader, SelectField, StatusBadge } from '../components/common'
import MultiSelectField from '../components/MultiSelectField'
import { useRecruiterRegistration } from './useRecruiterRegistration'

const NO_DEPARTMENTS = 'Choose at least one department.'

const emptyJob ={ jobTitle: '', jobType: 'Full-time', package: '', deadline: '', minCgpa: '', maxBacklogs: '0', allowedDepartments: [], jobDescription: '' }

const toForm = (job) => ({
  ...job,
  deadline: job.deadline ? job.deadline.slice(0, 10) : '',
  allowedDepartments: job.allowedDepartments || [],
})

const toBody = (form) => ({
  jobTitle: form.jobTitle,
  jobType: form.jobType,
  package: Number(form.package),
  deadline: form.deadline,
  minCgpa: Number(form.minCgpa),
  maxBacklogs: Number(form.maxBacklogs),
  allowedDepartments: form.allowedDepartments,
  jobDescription: form.jobDescription,
})

function JobForm({ job, onSaved, onCancel }) {
  const [form, setForm] = useState(job ? toForm(job) : emptyJob)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (name) => (event) => setForm({ ...form, [name]: event.target.value })
  const noDepartments = form.allowedDepartments.length === 0
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (noDepartments) {
      setError(NO_DEPARTMENTS)
      return
    }
    setSaving(true)
    try {
      if (job) await api.put(`${endpoints.jobs}/${job.jobId}`, toBody(form))
      else await api.post(endpoints.jobs, toBody(form))
      onSaved(job ? 'Job updated.' : 'Job added.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }
  return <form className="surface form-grid" onSubmit={submit}>
    <h3 className="full-field">{job ? `Edit ${job.jobTitle}` : 'Add a job'}</h3>
    <Field label="Job title" value={form.jobTitle} onChange={set('jobTitle')} required />
    <SelectField label="Job type" value={form.jobType} onChange={set('jobType')}><option>Full-time</option><option>Internship</option></SelectField>
    <Field label="Package (₹ per year)" type="number" min="0" value={form.package} onChange={set('package')} required />
    <Field label="Application deadline" type="date" value={form.deadline} onChange={set('deadline')} required />
    <Field label="Minimum CGPA" type="number" min="0" max="10" step="0.01" value={form.minCgpa} onChange={set('minCgpa')} required />
    <Field label="Maximum backlogs" type="number" min="0" value={form.maxBacklogs} onChange={set('maxBacklogs')} required />
    <MultiSelectField label="Departments" options={DEPARTMENTS} value={form.allowedDepartments} onChange={(allowedDepartments) => setForm({ ...form, allowedDepartments })} placeholder="Choose departments" invalid={error === NO_DEPARTMENTS} />
    <label className="field full-field"><span>Job description</span><textarea rows="4" value={form.jobDescription} onChange={set('jobDescription')} required /></label>
    {error && <div className="error-state full-field">{error}</div>}
    <button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : job ? 'Save job' : 'Add job'}</button>
    <button className="button button-light" type="button" onClick={onCancel}>Cancel</button>
  </form>
}

export default function RecruiterJobsPage() {
  const { registration, loading, error, reload, editable, approved } = useRecruiterRegistration()
  // null, 'new', or the job being edited
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState(null)
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  const { jobs } = registration
  const canAdd = editable || approved
  const saved = (text) => { setEditing(null); setMessage({ type: 'success', text }); reload() }
  const remove = async (job) => {
    if (!window.confirm(`Delete ${job.jobTitle}?`)) return
    try {
      await api.delete(`${endpoints.jobs}/${job.jobId}`)
      setMessage({ type: 'success', text: 'Job deleted.' })
      reload()
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.message })
    }
  }
  const action = canAdd && <button className="button button-dark" onClick={() => { setMessage(null); setEditing(editing === 'new' ? null : 'new') }}>{editing === 'new' ? 'Cancel' : 'Add job'}</button>
  return <>
    <PageHeader eyebrow="Recruiter workspace" title="Your jobs" description={approved ? 'New jobs go live to students straight away. Existing jobs can’t be changed.' : 'Jobs you add here are sent to the placement officer with your company registration.'} action={action} />
    {message && <div className={message.type === 'success' ? 'success-state' : 'error-state'}>{message.text}</div>}
    {editing && <JobForm key={editing === 'new' ? 'new' : editing.jobId} job={editing === 'new' ? null : editing} onSaved={saved} onCancel={() => setEditing(null)} />}
    {jobs.length === 0
      ? <EmptyState title="No jobs yet" message={canAdd ? 'Add the jobs you are hiring for.' : 'Jobs you added will appear here.'} />
      : <div className="table-wrap"><table><thead><tr><th>Job</th><th>Package</th><th>Deadline</th><th>Eligibility</th><th>Status</th>{(editable || approved) && <th>Actions</th>}</tr></thead><tbody>{jobs.map((job) => <tr key={job.jobId}>
        <td><strong>{job.jobTitle}</strong><small>{job.jobType}</small></td>
        <td>{formatCurrency(job.package)}</td>
        <td>{formatDate(job.deadline)}</td>
        <td><small>CGPA ≥ {job.minCgpa} · backlogs ≤ {job.maxBacklogs} · {job.allowedDepartments?.join(', ')}</small></td>
        <td><StatusBadge value={job.jobStatus} /></td>
        {editable && <td><button className="button button-light" onClick={() => { setMessage(null); setEditing(job) }}>Edit</button> <button className="button button-light" onClick={() => remove(job)}>Delete</button></td>}
        {approved && <td><Link to={`/recruiter/jobs/${job.jobId}`}>Hiring details →</Link></td>}
      </tr>)}</tbody></table></div>}
  </>
}

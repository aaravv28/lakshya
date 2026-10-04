import { useState } from 'react'
import { api, endpoints } from '../services/api'
import { INDUSTRIES } from '../config/appConfig'
import { DetailRow, ErrorState, Field, LoadingState, PageHeader, SectionHeading, SelectField } from '../components/common'
import { useRecruiterRegistration } from './useRecruiterRegistration'

const recruiterFields = [['recruiterName', 'Full name'], ['phone', 'Phone', { type: 'tel' }], ['designation', 'Designation']]
const companyFields = [['companyName', 'Company name'], ['industry', 'Industry', { options: INDUSTRIES, placeholder: 'Choose an industry' }], ['description', 'About the company'], ['logoUrl', 'Logo URL (optional)', { type: 'url', required: false }]]

// A saved value that is no longer on the list starts empty, so the dropdown asks for a choice
// instead of looking set while still holding the old value.
const startingValue = (value, options) => (options && !options.includes(value) ? '' : value || '')

function EditRegistrationForm({ registration, onSaved }) {
  const [form, setForm] = useState(() => Object.fromEntries([
    ...recruiterFields.map(([name]) => [name, registration.recruiter[name] || '']),
    ...companyFields.map(([name, , props]) => [name, startingValue(registration.company[name], props?.options)]),
  ]))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await api.put(endpoints.registration, form)
      onSaved()
    } catch (requestError) {
      setError({ message: requestError.message, field: requestError.data?.field })
    } finally {
      setSaving(false)
    }
  }
  const field = ([name, label, props = {}]) => {
    const Input = props.options ? SelectField : Field
    return <Input key={name} label={error?.field === name ? `${label} — ${error.message}` : label} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} required aria-invalid={error?.field === name || undefined} {...props} />
  }
  return <form className="surface form-grid" onSubmit={submit}>
    <h3 className="full-field">Your details</h3>
    {recruiterFields.map(field)}
    <h3 className="full-field">Your company</h3>
    {companyFields.map(field)}
    {error && <div className="error-state full-field">{error.message}</div>}
    <button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
  </form>
}

export default function RecruiterCompanyPage() {
  const { registration, loading, error, reload, editable, approved } = useRecruiterRegistration()
  const [editing, setEditing] = useState(false)
  const [success, setSuccess] = useState('')
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  const { recruiter, company } = registration
  const saved = () => { setEditing(false); setSuccess('Changes saved.'); reload() }
  const action = editable && <button className="button button-dark" onClick={() => { setSuccess(''); setEditing(!editing) }}>{editing ? 'Cancel' : 'Edit details'}</button>
  return <>
    <PageHeader eyebrow="Company profile" title={company.companyName} description={company.description} action={action} />
    {success && <div className="success-state">{success}</div>}
    {editing && editable && <EditRegistrationForm registration={registration} onSaved={saved} />}
    <section className="surface">
      <SectionHeading title="Company" />
      <div className="detail-grid">
        <DetailRow label="Industry" value={company.industry} />
        <DetailRow label="Logo" value={company.logoUrl || '—'} />
        <DetailRow label="Company ID" value={company.companyId} />
      </div>
    </section>
    <section className="surface">
      <SectionHeading title="Recruiter" />
      <div className="detail-grid">
        <DetailRow label="Name" value={recruiter.recruiterName} />
        <DetailRow label="Email" value={recruiter.recruiterEmail} />
        <DetailRow label="Phone" value={recruiter.phone} />
        <DetailRow label="Designation" value={recruiter.designation} />
      </div>
    </section>
    {approved && <p className="muted">Your company registration is approved, so these details can no longer be changed.</p>}
  </>
}

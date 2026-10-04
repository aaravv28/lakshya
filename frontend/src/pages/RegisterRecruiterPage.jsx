import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { INDUSTRIES } from '../config/appConfig'
import { Field, SelectField } from '../components/common'

const recruiterFields = [
  ['recruiterName', 'Full name', { autoComplete: 'name' }],
  ['recruiterEmail', 'Work email', { type: 'email', autoComplete: 'email' }],
  ['phone', 'Phone', { type: 'tel', autoComplete: 'tel' }],
  ['designation', 'Designation', { placeholder: 'e.g. Talent Lead' }],
  ['password', 'Password', { type: 'password', autoComplete: 'new-password' }],
]

const companyFields = [
  ['companyName', 'Company name', { autoComplete: 'organization' }],
  ['industry', 'Industry', { options: INDUSTRIES, placeholder: 'Choose an industry' }],
  ['description', 'About the company'],
  ['logoUrl', 'Logo URL (optional)', { type: 'url', required: false }],
]

const emptyForm = Object.fromEntries([...recruiterFields, ...companyFields].map(([name]) => [name, '']))

export default function RegisterRecruiterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await api.post('/auth/register-recruiter', form)
      navigate('/login?role=recruiter', { state: { registered: true } })
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

  return <main className="auth-page"><div className="auth-visual"><Link className="auth-brand" to="/"><span className="brand-mark">L</span><strong>Lakshya</strong></Link><div><span className="eyebrow">DDU · CAREER SERVICES</span><h1>Hire from campus<br /><em>with Lakshya.</em></h1><p>Register your company. The placement officer reviews it before students can see it.</p></div><span className="auth-visual-foot">Campus placement management platform</span></div>
    <section className="auth-panel">
      <Link className="auth-back" to="/login?role=recruiter">← Back to sign in</Link>
      <div className="auth-heading"><span className="eyebrow">New recruiter</span><h2>Register your company.</h2><p>You can add jobs and submit for approval after you sign in.</p></div>
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">Your details</span>
        {recruiterFields.map(field)}
        <span className="eyebrow">Your company</span>
        {companyFields.map(field)}
        {error && <div className="auth-error">{error.message}</div>}
        <button className="button button-dark auth-submit" type="submit" disabled={saving}>{saving ? 'Registering…' : 'Register ↗'}</button>
      </form>
    </section>
  </main>
}

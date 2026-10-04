import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../auth/useAuth'

const roles = [
  ['student', 'Student'],
  ['recruiter', 'Recruiter'],
  ['officer', 'Placement Officer'],
]

export default function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, isAuthenticated, role: currentRole } = useAuth()
  const [role, setRole] = useState(new URLSearchParams(location.search).get('role') || 'student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate(`/${currentRole}/dashboard`, { replace: true })
  }, [currentRole, isAuthenticated, navigate])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await api.post('/auth/login', { email, password, role })
      login(session)
      navigate(`/${session.role}/dashboard`, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-page"><div className="auth-visual"><Link className="auth-brand" to="/"><span className="brand-mark">L</span><strong>Lakshya</strong></Link><div><span className="eyebrow">DDU · CAREER SERVICES</span><h1>Your next move<br /><em>starts here.</em></h1><p>Sign in to continue to your placement workspace.</p></div><span className="auth-visual-foot">Campus placement management platform</span></div><section className="auth-panel"><Link className="auth-back" to="/">← Back to Lakshya</Link><div className="auth-heading"><span className="eyebrow">Secure workspace access</span><h2>Welcome back.</h2><p>Use your registered account to continue.</p></div><form className="auth-form" onSubmit={submit}><label className="field"><span>Workspace role</span><select value={role} onChange={(event) => setRole(event.target.value)}>{roles.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="field"><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@ddu.ac.in" required autoComplete="email" /></label><label className="field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required autoComplete="current-password" /></label>{location.state?.registered && !error && <div className="success-state">Registered. Log in to continue.</div>}{error && <div className="auth-error">{error}</div>}<button className="button button-dark auth-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in ↗'}</button></form>{role === 'student' && <p className="auth-note">Forgot your password? Contact your placement officer.</p>}{role === 'recruiter' && <p className="auth-note">New to Lakshya? <Link to="/register/recruiter">Register as a recruiter</Link></p>}<p className="auth-note">Demo credentials are initialized for development accounts only.</p></section></main>
}

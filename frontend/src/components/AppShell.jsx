import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { api, endpoints } from '../services/api'
import { Logo } from './common'
import { useAuth } from '../auth/useAuth'
import { RecruiterRegistrationProvider, RegistrationBanner } from '../recruiter/RecruiterRegistration'
import { useRecruiterRegistration } from '../recruiter/useRecruiterRegistration'

const icons = { Dashboard: '⌂', Jobs: '↗', Applications: '▣', Interviews: '◷', Profile: '◉', Resume: '▤', Projects: '⌘', Notifications: '◌', Company: '◈', Applicants: '☷', Recruiters: '♢', Students: '♙', Pending: '◔' }

const navGroups = {
  student: [['Overview', [['Dashboard', '/student/dashboard'], ['Jobs', '/student/jobs'], ['Applications', '/student/applications'], ['Interviews', '/student/interviews']]], ['My profile', [['Profile', '/student/profile'], ['Resume', '/student/resume'], ['Projects', '/student/projects'], ['Notifications', '/student/notifications']]]],
  recruiter: [['Recruiting', [['Dashboard', '/recruiter/dashboard'], ['Company', '/recruiter/company'], ['Jobs', '/recruiter/jobs'], ['Applicants', '/recruiter/applicants'], ['Interviews', '/recruiter/interviews']]]],
  officer: [['Placement office', [['Dashboard', '/officer/dashboard'], ['Pending', '/officer/pending'], ['Jobs', '/officer/jobs'], ['Companies', '/officer/companies'], ['Recruiters', '/officer/recruiters'], ['Students', '/officer/students']]]],
}

// Until the placement officer approves their company registration, a recruiter only needs these pages.
const unapprovedRecruiterPages = ['/recruiter/dashboard', '/recruiter/company', '/recruiter/jobs']

export default function AppShell({ role, children }) {
  if (role === 'recruiter') return <RecruiterRegistrationProvider><Shell role={role}><RegistrationBanner />{children}</Shell></RecruiterRegistrationProvider>
  return <Shell role={role}>{children}</Shell>
}

// How many company registrations are waiting for the placement officer; refreshed whenever the page changes.
function usePendingCount(enabled) {
  const { pathname } = useLocation()
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    api.get(`${endpoints.registration}/pending`).then((pending) => { if (!cancelled) setCount(pending.length) }).catch(() => {})
    return () => { cancelled = true }
  }, [enabled, pathname])
  return count
}

function Shell({ role, children }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { registration, approved } = useRecruiterRegistration()
  const pendingCount = usePendingCount(role === 'officer')
  const labelFor = (label) => label === 'Pending' && pendingCount > 0 ? `Pending (${pendingCount})` : label
  const visible = (path) => role !== 'recruiter' || approved || !registration || unapprovedRecruiterPages.includes(path)
  return <div className="app-shell"><aside className="sidebar"><Logo /><div className="workspace-label">{user?.role} workspace</div><nav>{navGroups[role].map(([group, links]) => <div className="nav-group" key={group}><span className="nav-label">{group}</span>{links.filter(([, path]) => visible(path)).map(([label, path]) => <NavLink className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} to={path} key={path}><i>{icons[label] || '•'}</i>{labelFor(label)}</NavLink>)}</div>)}</nav><button className="switch-link" onClick={() => { logout(); navigate('/') }}>↪ Sign out</button></aside><main className="main-area"><header className="topbar"><div className="mobile-brand"><Logo /></div><div className="topbar-context"><span>{user?.role} workspace</span><strong>{user?.id}</strong></div><button className="header-logout" onClick={() => { logout(); navigate('/') }}>Sign out</button><div className="avatar" title={user?.name}>{user?.name?.slice(0, 1)}</div></header><div className="content">{children}</div></main></div>
}

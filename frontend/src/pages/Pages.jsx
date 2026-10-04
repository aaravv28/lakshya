import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, endpoints } from '../services/api'
import { API_BASE_URL, DEPARTMENTS, formatCurrency, formatDate } from '../config/appConfig'
import { useAuth } from '../auth/useAuth'
import { useRecruiterRegistration } from '../recruiter/useRecruiterRegistration'
import { DetailRow, EmptyState, ErrorState, Field, LoadingState, PageHeader, SectionHeading, SelectField, StatCard, StatusBadge } from '../components/common'

function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const reload = useCallback(() => {
    setState({ data: null, loading: true, error: '' })
    api.get(path).then((data) => setState({ data, loading: false, error: '' })).catch((error) => setState({ data: null, loading: false, error: error.message }))
  }, [path])

  useEffect(() => {
    let cancelled = false
    api.get(path).then((data) => {
      if (!cancelled) setState({ data, loading: false, error: '' })
    }).catch((error) => {
      if (!cancelled) setState({ data: null, loading: false, error: error.message })
    })
    return () => { cancelled = true }
  }, [path])

  return { ...state, reload }
}

const list = (data) => Array.isArray(data) ? data : []
const parseSkills = (text) => text.split(',').map((item) => item.trim()).filter(Boolean)
const companyName = (companies, id) => companies.find((company) => company.companyId === id)?.companyName || id || 'Unknown company'
const jobTitle = (jobs, id) => jobs.find((job) => job.jobId === id)?.jobTitle || id || 'Unknown job'

function ResourceState({ resource, children, emptyTitle = 'Nothing here yet', emptyMessage = 'There are no records to show.' }) {
  if (resource.loading) return <LoadingState />
  if (resource.error) return <ErrorState message={resource.error} onRetry={resource.reload} />
  if (!list(resource.data).length) return <EmptyState title={emptyTitle} message={emptyMessage} />
  return children
}

export function LandingPage() {
  const roles = [['student', 'Student', 'Explore opportunities, track applications, and build your profile.'], ['recruiter', 'Recruiter', 'Find promising talent and move candidates through your pipeline.'], ['officer', 'Placement Officer', 'Coordinate students, companies, and campus-wide outcomes.']]
  return <div className="landing"><header className="landing-nav"><span className="brand-mark">L</span><strong>Lakshya</strong><span className="landing-tag">Campus placement, made clear.</span></header><main className="landing-main"><section className="landing-copy"><span className="eyebrow">DDU · CAREER SERVICES</span><h1>Make the next<br /><em>move</em> count.</h1><p>A focused workspace for students, recruiters, and placement teams to turn campus opportunity into momentum.</p><div className="landing-meta"><span>01</span><span>Discover</span><span>02</span><span>Connect</span><span>03</span><span>Launch</span></div></section><section className="role-panel"><div className="panel-kicker">Choose your workspace</div>{roles.map(([role, title, text], index) => <Link className="role-card" to={`/login?role=${role}`} key={role}><span className="role-number">0{index + 1}</span><span><strong>{title}</strong><small>{text}</small></span><b>↗</b></Link>)}<p className="demo-note">Sign in with your registered account</p></section></main><footer className="landing-footer"><span>LAKSHYA / 2026</span><span>Campus Placement Management Platform</span></footer></div>
}

export function StudentDashboard() {
  const { user } = useAuth()
  const student = useFetch(`${endpoints.students}/${user.id}`)
  const applications = useFetch(`${endpoints.applications}/student/${user.id}`)
  const jobs = useFetch(endpoints.jobs)
  const notifications = useFetch(`${endpoints.notifications}/student/${user.id}`)
  const interviews = useFetch(endpoints.interviews)
  const resources = [student, applications, jobs, notifications, interviews]
  if (resources.some((resource) => resource.loading)) return <LoadingState label="Preparing your dashboard" />
  if (resources.some((resource) => resource.error)) return <ErrorState message={resources.find((resource) => resource.error)?.error} />
  const profile = student.data || {}
  const upcoming = list(interviews.data).slice(0, 2)
  return <><PageHeader eyebrow="Student dashboard" title={`Good morning, ${profile.studentName?.split(' ')[0] || 'there'}.`} description="Your placement journey at a glance." action={<Link className="button button-dark" to="/student/jobs">Explore jobs ↗</Link>} /><div className="stats-grid"><StatCard label="Profile readiness" value={`${profile.cgpa || 0} CGPA`} detail={`${profile.skills?.length || 0} skills listed`} accent="blue" /><StatCard label="Applications" value={list(applications.data).length} detail="Across all opportunities" accent="yellow" /><StatCard label="Open roles" value={list(jobs.data).filter((job) => job.jobStatus?.toLowerCase() === 'open').length} detail="Matching your campus" accent="green" /><StatCard label="Unread updates" value={list(notifications.data).filter((item) => !item.isRead).length} detail="Keep your eye on these" accent="pink" /></div><div className="dashboard-grid"><section className="surface"><SectionHeading title="Profile snapshot" action={<Link to="/student/profile">View profile →</Link>} /><div className="profile-snapshot"><div className="large-avatar">{(profile.studentName || 'A').slice(0, 1)}</div><div><h3>{profile.studentName || 'Student'}</h3><p>{profile.department || 'Department not specified'} · Semester {profile.semester || '—'}</p><div className="tag-row"><span>{profile.enrollmentNo}</span><span>{profile.backlogs ?? 0} backlogs</span></div></div></div></section><section className="surface"><SectionHeading title="Next interviews" action={<Link to="/student/interviews">See all →</Link>} />{upcoming.length ? upcoming.map((interview) => <div className="mini-item" key={interview.interviewId}><span className="date-tile">{new Date(interview.interviewDate).getDate()}</span><div><strong>{interview.interviewRound}</strong><small>{formatDate(interview.interviewDate)} · {interview.interviewTime} · {interview.interviewMode}</small></div><StatusBadge value={interview.interviewStatus} /></div>) : <EmptyState title="No interviews scheduled" message="Interview invitations will appear here." />}</section></div><section className="surface"><SectionHeading title="Open opportunities" action={<Link to="/student/jobs">Browse all →</Link>} /><JobList jobs={list(jobs.data).slice(0, 3)} /></section></>
}

export function StudentJobs() {
  const jobs = useFetch(endpoints.jobs)
  const companies = useFetch(endpoints.companies)
  const [query, setQuery] = useState('')
  const filtered = list(jobs.data).filter((job) => `${job.jobTitle} ${companyName(list(companies.data), job.companyId)}`.toLowerCase().includes(query.toLowerCase()))
  return <><PageHeader eyebrow="Opportunities" title="Find your next role." description="Explore verified campus opportunities that match your ambition." /><div className="toolbar"><input className="search-input" placeholder="Search roles or companies" value={query} onChange={(event) => setQuery(event.target.value)} /><span className="result-count">{filtered.length} opportunities</span></div><ResourceState resource={jobs} emptyTitle="No opportunities found" emptyMessage="Published roles will appear here when companies open applications."><div className="job-grid">{filtered.map((job) => <JobCard key={job.jobId} job={job} company={companyName(list(companies.data), job.companyId)} />)}</div></ResourceState></>
}

function JobList({ jobs }) { return <div className="job-list">{jobs.map((job) => <JobCard key={job.jobId} job={job} compact />)}</div> }
function JobCard({ job, company, compact = false, detailsPath = `/student/jobs/${job.jobId}` }) { return <article className={`job-card ${compact ? 'compact' : ''}`}><div className="company-logo">{(company || job.companyId || 'C').slice(0, 1)}</div><div className="job-card-main"><div className="card-topline"><span className="eyebrow">{company || job.companyId}</span><StatusBadge value={job.jobStatus} /></div><h3>{job.jobTitle}</h3><p>{job.jobType} · {formatCurrency(job.package)} · Min CGPA {job.minCgpa}</p>{!compact && <div className="tag-row"><span>Deadline {formatDate(job.deadline)}</span><span>{job.allowedDepartments?.join(', ')}</span></div>}</div><Link className="icon-link" to={detailsPath}>↗</Link></article> }

export function JobDetails() {
  const { jobId } = useParams()
  const { user } = useAuth()
  const DEMO_USERS = { student: { id: user.id } }
  const job = useFetch(`${endpoints.jobs}/${jobId}`)
  const eligibility = useFetch(`${endpoints.jobs}/eligibility/${user.id}/${jobId}`)
  const companies = useFetch(endpoints.companies)
  const applications = useFetch(`${endpoints.applications}/student/${user.id}`)
  if (job.loading || eligibility.loading || companies.loading || applications.loading) return <LoadingState />
  if (job.error) return <ErrorState message={job.error} onRetry={job.reload} />
  const record = job.data
  const alreadyApplied = list(applications.data).some((item) => item.jobId === jobId)
  return <><Link className="back-link" to="/student/jobs">← All opportunities</Link><PageHeader eyebrow={companyName(list(companies.data), record.companyId)} title={record.jobTitle} description={record.jobDescription} action={<StatusBadge value={record.jobStatus} />} /><div className="detail-layout"><section className="surface"><SectionHeading title="Role overview" /><div className="detail-grid"><DetailRow label="Job type" value={record.jobType} /><DetailRow label="Package" value={formatCurrency(record.package)} /><DetailRow label="Deadline" value={formatDate(record.deadline)} /></div><div className="description-block"><h3>What you should know</h3><p>{record.jobDescription}</p></div><div className="tag-row large-tags">{record.allowedDepartments?.map((department) => <span key={department}>{department}</span>)}</div></section><aside className={`eligibility-card ${eligibility.data?.eligible ? 'eligible' : 'not-eligible'}`}><span className="eyebrow">Eligibility check</span><strong>{eligibility.data?.eligible ? 'You are eligible' : 'Not eligible yet'}</strong><p>{eligibility.data?.eligible ? 'This role meets the criteria in your student profile.' : 'Review the criteria below against your current profile.'}</p><div className="criteria"><div><span>CGPA</span><b>{eligibility.data?.studentCgpa} / {eligibility.data?.minCgpa} min</b></div><div><span>Backlogs</span><b>{eligibility.data?.studentBacklogs} / {eligibility.data?.maxBacklogs} max</b></div><div><span>Department</span><b>{eligibility.data?.department}</b></div></div>{eligibility.data?.eligible && <button className="button button-dark full-width" disabled={alreadyApplied} onClick={() => api.post(endpoints.applications, { applicationId: `APP-${Date.now()}`, studentId: DEMO_USERS.student.id, jobId, recruiterId: record.recruiterId || 'REC001', applicationStatus: 'Applied' }).then(() => window.location.reload())}>{alreadyApplied ? 'Application submitted' : 'Apply for this role'}</button>}</aside></div></>
}

export function StudentApplications() { const { user } = useAuth(); const applications = useFetch(`${endpoints.applications}/student/${user.id}`); const jobs = useFetch(endpoints.jobs); return <><PageHeader eyebrow="Your progress" title="My applications" description="Every opportunity, in one place." /><ResourceState resource={applications} emptyTitle="No applications yet" emptyMessage="When you apply to a role, its progress will appear here."><div className="table-wrap"><table><thead><tr><th>Role</th><th>Applied</th><th>Recruiter</th><th>Status</th></tr></thead><tbody>{list(applications.data).map((item) => <tr key={item.applicationId}><td><strong>{jobTitle(list(jobs.data), item.jobId)}</strong><small>{item.jobId}</small></td><td>{formatDate(item.appliedDate)}</td><td>{item.recruiterId}</td><td><StatusBadge value={item.applicationStatus} /></td></tr>)}</tbody></table></div></ResourceState></> }

export function StudentInterviews() { const { user } = useAuth(); const applications = useFetch(`${endpoints.applications}/student/${user.id}`); const interviews = useFetch(endpoints.interviews); const jobs = useFetch(endpoints.jobs); const ids = new Set(list(applications.data).map((item) => item.applicationId)); const filtered = list(interviews.data).filter((item) => ids.has(item.applicationId)); return <><PageHeader eyebrow="Your schedule" title="Interviews" description="Stay ready for every conversation." /><ResourceState resource={interviews} emptyTitle="No interviews scheduled" emptyMessage="Interview details will appear when a recruiter schedules a round."><div className="interview-list">{filtered.map((item) => <article className="interview-card" key={item.interviewId}><div className="date-tile wide"><strong>{new Date(item.interviewDate).toLocaleDateString('en-IN', { day: '2-digit' })}</strong><span>{new Date(item.interviewDate).toLocaleDateString('en-IN', { month: 'short' })}</span></div><div><span className="eyebrow">{jobTitle(list(jobs.data), list(applications.data).find((app) => app.applicationId === item.applicationId)?.jobId)}</span><h3>{item.interviewRound}</h3><p>{item.interviewTime} · {item.interviewMode}</p></div><StatusBadge value={item.interviewStatus} /></article>)}</div></ResourceState></> }

function EditSkillsForm({ studentId, skills, onSaved }) {
  const [text, setText] = useState((skills || []).join(', '))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const student = await api.put(`${endpoints.students}/${studentId}`, { skills: parseSkills(text) })
      onSaved(student)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }
  return <form className="surface form-grid" onSubmit={submit}>
    <label className="field full-field"><span>Skills (comma separated)</span><input value={text} onChange={(event) => setText(event.target.value)} /></label>
    {error && <div className="error-state full-field">{error}</div>}
    <button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save skills'}</button>
  </form>
}

const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' }

function ChangePasswordForm({ studentId }) {
  const [form, setForm] = useState(emptyPasswords)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (name) => (event) => setForm({ ...form, [name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    setMessage(null)
    const missing = Object.fromEntries(Object.keys(emptyPasswords).filter((name) => !form[name]).map((name) => [name, 'Required']))
    setErrors(missing)
    if (Object.keys(missing).length > 0) return
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setSaving(true)
    try {
      const result = await api.put(`${endpoints.students}/${studentId}/password`, { currentPassword: form.currentPassword, newPassword: form.newPassword })
      setForm(emptyPasswords)
      setMessage({ type: 'success', text: result.message })
    } catch (requestError) {
      if (requestError.message === 'Current password is incorrect.') setForm(emptyPasswords)
      setMessage({ type: 'error', text: requestError.message })
    } finally {
      setSaving(false)
    }
  }
  const field = (name, label, autoComplete) => <Field label={errors[name] ? `${label} (${errors[name]})` : label} type="password" autoComplete={autoComplete} value={form[name]} onChange={set(name)} aria-invalid={Boolean(errors[name]) || undefined} />
  return <section className="surface">
    <SectionHeading title="Change password" />
    <form className="form-grid" onSubmit={submit} noValidate>
      {field('currentPassword', 'Current password', 'current-password')}
      {field('newPassword', 'New password', 'new-password')}
      {field('confirmPassword', 'Confirm new password', 'new-password')}
      {message && <div className={`${message.type === 'success' ? 'success-state' : 'error-state'} full-field`}>{message.text}</div>}
      <button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Changing…' : 'Change password'}</button>
    </form>
  </section>
}

export function StudentProfile() {
  const { user } = useAuth()
  const student = useFetch(`${endpoints.students}/${user.id}`)
  const [editing, setEditing] = useState(false)
  const [success, setSuccess] = useState('')
  const [updated, setUpdated] = useState(null)
  if (student.loading) return <LoadingState />
  if (student.error) return <ErrorState message={student.error} onRetry={student.reload} />
  const profile = updated || student.data
  const toggle = () => { setSuccess(''); setEditing(!editing) }
  const saved = (next) => { setEditing(false); setSuccess('Skills updated.'); setUpdated(next) }
  return <>
    <PageHeader eyebrow="Student profile" title={profile.studentName} description="Keep your placement profile accurate and ready to share." action={<button className="button button-dark" onClick={toggle}>{editing ? 'Cancel' : 'Edit skills'}</button>} />
    {success && <div className="success-state">{success}</div>}
    {editing && <EditSkillsForm studentId={user.id} skills={profile.skills} onSaved={saved} />}
    <section className="surface profile-detail"><div className="profile-snapshot"><div className="large-avatar">{profile.studentName.slice(0, 1)}</div><div><h3>{profile.studentName}</h3><p>{profile.studentEmail}</p><div className="tag-row">{profile.skills?.map((skill) => <span key={skill}>{skill}</span>)}</div></div></div><div className="detail-grid"><DetailRow label="Enrollment number" value={profile.enrollmentNo} /><DetailRow label="Department" value={profile.department} /><DetailRow label="Semester" value={profile.semester} /><DetailRow label="CGPA" value={profile.cgpa} /><DetailRow label="Backlogs" value={profile.backlogs} /></div></section>
    <p className="muted">Details other than skills are managed by your placement officer. Contact them if something is wrong.</p>
    <ChangePasswordForm studentId={user.id} />
  </>
}

export function StudentResume() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadResume = useCallback(() => {
    api.get('/resumes/me')
      .then((data) => {
        setResume(data)
        setLoading(false)
      })
      .catch(() => {
        setResume(null)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadResume()
  }, [loadResume])

  const validateChosenFile = (file) => {
    if (!file) return 'Please choose a PDF file.'
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are allowed.'
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'Resume must be 5 MB or smaller.'
    }
    return ''
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    const validationError = validateChosenFile(file)

    setSelectedFile(file)
    setError(validationError)
    if (!validationError) {
      setSuccess('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please choose a PDF file first.')
      return
    }

    const validationError = validateChosenFile(selectedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('resume', selectedFile)

      if (resume) {
        const response = await api.replace(`/resumes/${resume.resumeId}`, formData)
        setResume(response)
        setSuccess('Resume replaced successfully.')
      } else {
        const response = await api.upload('/resumes', formData)
        setResume(response)
        setSuccess('Resume uploaded successfully.')
      }
    } catch (uploadError) {
      setError(uploadError.message || 'Resume upload failed.')
    } finally {
      setUploading(false)
      setSelectedFile(null)
    }
  }

  const handleView = async () => {
    if (!resume || !resume.resumeId) return

    try {
      const token = localStorage.getItem('lakshya-auth')
      const authObject = token ? JSON.parse(token) : null
      const response = await fetch(`${API_BASE_URL}/resumes/${resume.resumeId}/view`, {
        headers: {
          ...(authObject?.token ? { Authorization: `Bearer ${authObject.token}` } : {}),
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Could not open the resume.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (viewError) {
      setError(viewError.message || 'Could not open the resume.')
    }
  }

  return <>
    <PageHeader eyebrow="Your documents" title="Resume" description="Upload and manage your student resume." />
    {loading ? <LoadingState /> : (
      <div className="surface">
        <div className="resume-card">
          <div className="file-icon">PDF</div>
          <div>
            <span className="eyebrow">Resume status</span>
            <h3>{resume ? resume.resumeId : 'No resume on file'}</h3>
            <p>{resume ? `Uploaded ${formatDate(resume.uploadedAt)}` : 'No resume has been uploaded yet.'}</p>
          </div>
        </div>

        {error && <div className="error-state" style={{ marginTop: '12px' }}>{error}</div>}
        {success && <div className="success-state" style={{ marginTop: '12px' }}>{success}</div>}

        <div style={{ marginTop: '20px' }}>
          <label className="field full-field">
            <span>Choose PDF</span>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
          </label>

          {selectedFile && (
            <p style={{ marginTop: '10px' }}>
              Selected file: <strong>{selectedFile.name}</strong>
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
            <button
              className="button button-dark"
              type="button"
              disabled={uploading || !selectedFile}
              onClick={handleUpload}
            >
              {uploading ? 'Uploading...' : (resume ? 'Replace Resume' : 'Upload Resume')}
            </button>

            {resume && (
              <button className="button" type="button" onClick={handleView}>
                View Resume
              </button>
            )}
          </div>
        </div>
      </div>
    )}
  </>
}

export function StudentProjects() { const { user } = useAuth(); const projects = useFetch(`${endpoints.projects}/student/${user.id}`); const [form, setForm] = useState({ projectId: '', projectTitle: '', projectDescription: '', technologies: '', projectUrl: '' }); const [showForm, setShowForm] = useState(false); const create = (event) => { event.preventDefault(); api.post(endpoints.projects, { ...form, studentId: user.id, technologies: form.technologies.split(',').map((item) => item.trim()).filter(Boolean) }).then(() => { setShowForm(false); projects.reload() }).catch(() => {}) }; return <><PageHeader eyebrow="Portfolio" title="Projects" description="Show the work that makes you stand out." action={<button className="button button-dark" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : 'Add project +'}</button>} />{showForm && <form className="surface form-grid" onSubmit={create}><Field label="Project ID" required value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} /><Field label="Project title" required value={form.projectTitle} onChange={(event) => setForm({ ...form, projectTitle: event.target.value })} /><label className="field full-field"><span>Description</span><textarea required value={form.projectDescription} onChange={(event) => setForm({ ...form, projectDescription: event.target.value })} /></label><Field label="Technologies" placeholder="React, Node.js" value={form.technologies} onChange={(event) => setForm({ ...form, technologies: event.target.value })} /><Field label="Project URL" required value={form.projectUrl} onChange={(event) => setForm({ ...form, projectUrl: event.target.value })} /><button className="button button-dark" type="submit">Create project</button></form>}<ResourceState resource={projects} emptyTitle="No projects added" emptyMessage="Add your strongest academic or personal project to build your profile."><div className="project-grid">{list(projects.data).map((project) => <article className="project-card" key={project.projectId}><span className="eyebrow">{project.projectId}</span><h3>{project.projectTitle}</h3><p>{project.projectDescription}</p><div className="tag-row">{project.technologies?.map((technology) => <span key={technology}>{technology}</span>)}</div><a href={project.projectUrl} target="_blank" rel="noreferrer">View project ↗</a></article>)}</div></ResourceState></> }

export function StudentNotifications() { const { user } = useAuth(); const notifications = useFetch(`${endpoints.notifications}/student/${user.id}`); const markRead = (notification) => api.put(`${endpoints.notifications}/${notification.notificationId}`, { isRead: true }).then(notifications.reload); return <><PageHeader eyebrow="Stay in the loop" title="Notifications" description="Important updates from your placement journey." /><ResourceState resource={notifications} emptyTitle="All quiet here" emptyMessage="New placement updates will appear in this feed."><div className="notification-list">{list(notifications.data).map((notification) => <article className={`notification-item ${notification.isRead ? '' : 'unread'}`} key={notification.notificationId}><span className="notification-dot" /><div><div className="card-topline"><span className="eyebrow">{notification.notificationType}</span><small>{formatDate(notification.createdAt)}</small></div><p>{notification.message}</p></div>{!notification.isRead && <button className="text-button" onClick={() => markRead(notification)}>Mark read</button>}</article>)}</div></ResourceState></> }

export function RecruiterDashboard() { const { user } = useAuth(); const recruiter = useFetch(`${endpoints.recruiters}/${user.id}`); const companies = useFetch(endpoints.companies); const jobs = useFetch(endpoints.jobs); const applications = useFetch(endpoints.applications); const companyId = recruiter.data?.companyId; const company = list(companies.data).find((item) => item.companyId === companyId); const ownJobs = list(jobs.data).filter((item) => item.companyId === companyId); const ownApplications = list(applications.data).filter((item) => ownJobs.some((job) => job.jobId === item.jobId)); if ([recruiter, companies, jobs, applications].some((item) => item.loading)) return <LoadingState />; return <><PageHeader eyebrow="Recruiter dashboard" title={`Build your next team.`} description={`${recruiter.data?.recruiterName || 'Recruiter'} · ${company?.companyName || recruiter.data?.companyId || 'Company workspace'}`} /><div className="stats-grid"><StatCard label="Open roles" value={ownJobs.length} detail="Your company listings" accent="blue" /><StatCard label="Applicants" value={ownApplications.length} detail="Across your roles" accent="yellow" /><StatCard label="Shortlisted" value={ownApplications.filter((item) => item.applicationStatus?.toLowerCase() === 'shortlisted').length} detail="Ready for next step" accent="green" /></div><section className="surface"><SectionHeading title="Your active jobs" action={<Link to="/recruiter/jobs">Manage jobs →</Link>} /><JobList jobs={ownJobs} /></section></> }



export function RecruiterApplicants() { const { registration } = useRecruiterRegistration(); const ownJobs = registration?.jobs || []; const applications = useFetch(endpoints.applications); const students = useFetch(endpoints.students); const [selectedJob, setSelectedJob] = useState(''); const filtered = list(applications.data).filter((item) => ownJobs.some((job) => job.jobId === item.jobId) && (!selectedJob || item.jobId === selectedJob)); const update = (applicationId, applicationStatus) => api.put(`${endpoints.applications}/${applicationId}`, { applicationStatus }).then(applications.reload); return <><PageHeader eyebrow="Talent pipeline" title="Applicants" description="Review candidates and keep application status current." /><div className="toolbar"><SelectField label="Filter by job" value={selectedJob} onChange={(event) => setSelectedJob(event.target.value)}><option value="">All jobs</option>{ownJobs.map((job) => <option key={job.jobId} value={job.jobId}>{job.jobTitle}</option>)}</SelectField></div><ResourceState resource={applications} emptyTitle="No applicants yet" emptyMessage="Applications will appear here as students apply to your roles."><div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Role</th><th>Applied</th><th>Update status</th></tr></thead><tbody>{filtered.map((application) => { const student = list(students.data).find((item) => item.enrollmentNo === application.studentId); return <tr key={application.applicationId}><td><strong>{student?.studentName || application.studentId}</strong><small>{student?.studentEmail || ''}</small></td><td>{jobTitle(ownJobs, application.jobId)}</td><td>{formatDate(application.appliedDate)}</td><td><select className="inline-select" value={application.applicationStatus} onChange={(event) => update(application.applicationId, event.target.value)}><option>Applied</option><option>Shortlisted</option><option>Selected</option><option>Rejected</option></select></td></tr> })}</tbody></table></div></ResourceState></> }

export function RecruiterInterviews() { const interviews = useFetch(endpoints.interviews); return <><PageHeader eyebrow="Recruiter workspace" title="Interviews" description="A clear view of every scheduled conversation." /><ResourceState resource={interviews} emptyTitle="No interviews scheduled" emptyMessage="Interview records will appear here when they are created."><div className="interview-list">{list(interviews.data).map((item) => <article className="interview-card" key={item.interviewId}><div><span className="eyebrow">{item.applicationId}</span><h3>{item.interviewRound}</h3><p>{formatDate(item.interviewDate)} · {item.interviewTime} · {item.interviewMode}</p></div><StatusBadge value={item.interviewStatus} /></article>)}</div></ResourceState></> }

export function OfficerDashboard() { const students = useFetch(endpoints.students); const companies = useFetch(endpoints.companies); const jobs = useFetch(endpoints.jobs); const applications = useFetch(endpoints.applications); if ([students, companies, jobs, applications].some((item) => item.loading)) return <LoadingState />; return <><PageHeader eyebrow="Placement office" title="The campus, in motion." description="Coordinate the people and opportunities behind every placement." /><div className="stats-grid"><StatCard label="Students" value={list(students.data).length} detail="Registered profiles" accent="blue" /><StatCard label="Companies" value={list(companies.data).length} detail="On the platform" accent="yellow" /><StatCard label="Open jobs" value={list(jobs.data).filter((job) => job.jobStatus?.toLowerCase() === 'open').length} detail="Published roles" accent="green" /><StatCard label="Applications" value={list(applications.data).length} detail="Total submissions" accent="blue" /></div><section className="surface"><SectionHeading title="Latest companies" action={<Link to="/officer/companies">See all →</Link>} />{list(companies.data).slice(0, 4).map((company) => <div className="mini-item" key={company.companyId}><div className="company-logo">{company.companyName.slice(0, 1)}</div><div><strong>{company.companyName}</strong><small>{company.industry}</small></div><span className="muted">{company.companyId}</span></div>)}</section></> }

const officerTables = { companies: { title: 'Companies', eyebrow: 'Employer network', description: 'Companies participating in campus placement.', endpoint: endpoints.companies, columns: [['companyName', 'Company'], ['industry', 'Industry'], ['companyId', 'ID']] }, recruiters: { title: 'Recruiters', eyebrow: 'Employer network', description: 'Recruiter contacts connected to placement partners.', endpoint: endpoints.recruiters, columns: [['recruiterName', 'Recruiter'], ['companyId', 'Company'], ['recruiterEmail', 'Email'], ['designation', 'Designation']] }, students: { title: 'Students', eyebrow: 'Student directory', description: 'Placement-ready student profiles across campus.', endpoint: endpoints.students, columns: [['studentName', 'Student'], ['department', 'Department'], ['cgpa', 'CGPA'], ['backlogs', 'Backlogs']] } }

function OfficerTable({ type, resource, action, children, rowAction }) { const config = officerTables[type]; return <><PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} action={action} />{children}<ResourceState resource={resource} emptyTitle={`No ${type} found`} emptyMessage="Records from the backend will appear here."><div className="table-wrap"><table><thead><tr>{config.columns.map(([, label]) => <th key={label}>{label}</th>)}{rowAction && <th>Actions</th>}</tr></thead><tbody>{list(resource.data).map((item) => <tr key={item._id || item[config.columns[0][0]]}>{config.columns.map(([field]) => <td key={field}>{(item[field] ?? '') === '' ? '—' : item[field]}</td>)}{rowAction && <td>{rowAction(item)}</td>}</tr>)}</tbody></table></div></ResourceState></> }

function OfficerTablePage({ type }) { const resource = useFetch(officerTables[type].endpoint); return <OfficerTable type={type} resource={resource} /> }

export const OfficerCompanies = () => <OfficerTablePage type="companies" />
export const OfficerRecruiters = () => <OfficerTablePage type="recruiters" />

const emptyStudent = { enrollmentNo: '', studentName: '', studentEmail: '', department: '', semester: '', cgpa: '', backlogs: '', skills: '', password: '' }
const studentFields = [['enrollmentNo', 'Enrollment no.'], ['studentName', 'Full name'], ['studentEmail', 'Email', { type: 'email' }], ['department', 'Department', { options: DEPARTMENTS, placeholder: 'Choose a department' }], ['semester', 'Semester', { type: 'number' }], ['cgpa', 'CGPA', { type: 'number', min: 0, max: 10, step: 0.01 }], ['backlogs', 'Backlogs', { type: 'number', min: 0 }], ['password', 'Password', { type: 'password', autoComplete: 'new-password' }]]

function AddStudentForm({ onAdded }) {
  const [form, setForm] = useState(emptyStudent)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const student = await api.post(endpoints.students, { ...form, semester: Number(form.semester), cgpa: Number(form.cgpa), backlogs: Number(form.backlogs), skills: parseSkills(form.skills) })
      onAdded(student)
    } catch (requestError) {
      setError({ message: requestError.message, field: requestError.data?.field })
    } finally {
      setSaving(false)
    }
  }
  return <form className="surface form-grid" onSubmit={submit}>
    {studentFields.map(([name, label, props = {}]) => {
      const Input = props.options ? SelectField : Field
      return <Input key={name} label={error?.field === name ? `${label} (already in use)` : label} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} required aria-invalid={error?.field === name || undefined} {...props} />
    })}
    <label className="field full-field"><span>Skills (comma separated, optional)</span><input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} /></label>
    {error && <div className="error-state full-field">{error.message}</div>}
    <button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add student'}</button>
  </form>
}

function SetPasswordForm({ student, onDone, onCancel }) {
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const result = await api.put(`${endpoints.students}/${student.enrollmentNo}/password`, { newPassword })
      onDone(result.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }
  return <form className="surface form-grid" onSubmit={submit}>
    <h3 className="full-field">Set password for {student.studentName} ({student.enrollmentNo})</h3>
    <Field label="New password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
    {error && <div className="error-state full-field">{error}</div>}
    <button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save password'}</button>
    <button className="button button-light" type="button" onClick={onCancel}>Cancel</button>
  </form>
}

export function OfficerStudents() {
  const resource = useFetch(endpoints.students)
  const [panel, setPanel] = useState(null)
  const [success, setSuccess] = useState('')
  const open = (next) => { setSuccess(''); setPanel(next) }
  const added = (student) => { setPanel(null); setSuccess(`Student added: ${student.studentName}`); resource.reload() }
  const action = <button className="button button-dark" onClick={() => open(panel === 'add' ? null : 'add')}>{panel === 'add' ? 'Cancel' : 'Add student'}</button>
  const passwordSet = (message) => { setPanel(null); setSuccess(message) }
  const rowAction = (student) => <button className="button button-light" onClick={() => open({ student })}>Set password</button>
  return <OfficerTable type="students" resource={resource} action={action} rowAction={rowAction}>
    {success && <div className="success-state">{success}</div>}
    {panel === 'add' && <AddStudentForm onAdded={added} />}
    {panel?.student && <SetPasswordForm key={panel.student.enrollmentNo} student={panel.student} onDone={passwordSet} onCancel={() => setPanel(null)} />}
  </OfficerTable>
}


export function JobHiringDetails({ backTo }) {
  const { jobId } = useParams()
  const job = useFetch(`${endpoints.jobs}/${jobId}`)
  const companies = useFetch(endpoints.companies)
  const applications = useFetch(`${endpoints.applications}/job/${jobId}`)
  const students = useFetch(endpoints.students)
  if ([job, companies, applications, students].some((item) => item.loading)) return <LoadingState />
  if (job.error) return <ErrorState message={job.error} onRetry={job.reload} />
  const record = job.data
  const received = list(applications.data)
  const count = (status) => received.filter((item) => item.applicationStatus?.toLowerCase() === status.toLowerCase()).length
  const deadlinePassed = record.deadline && new Date(record.deadline) < new Date()
  const studentFor = (application) => list(students.data).find((item) => item.enrollmentNo === application.studentId)
  return <>
    <Link className="back-link" to={backTo}>← All jobs</Link>
    <PageHeader eyebrow={companyName(list(companies.data), record.companyId)} title={record.jobTitle} description={record.jobDescription} action={<StatusBadge value={record.jobStatus} />} />
    <div className="stats-grid">
      <StatCard label="Applied" value={received.length} detail="Total applications" accent="blue" />
      <StatCard label="Shortlisted" value={count('Shortlisted')} detail="Moved to next round" accent="yellow" />
      <StatCard label="Selected" value={count('Selected')} detail={deadlinePassed ? 'Final result' : 'So far'} accent="green" />
      <StatCard label="Rejected" value={count('Rejected')} detail={`${count('Applied')} still under review`} accent="pink" />
    </div>
    <section className="surface">
      <SectionHeading title="Role overview" />
      <div className="detail-grid">
        <DetailRow label="Job status" value={record.jobStatus} />
        <DetailRow label="Applications" value={deadlinePassed ? `Closed on ${formatDate(record.deadline)}` : `Open until ${formatDate(record.deadline)}`} />
        <DetailRow label="Job type" value={record.jobType} />
        <DetailRow label="Package" value={formatCurrency(record.package)} />
        <DetailRow label="Min CGPA" value={record.minCgpa} />
        <DetailRow label="Max backlogs" value={record.maxBacklogs} />
        <DetailRow label="Departments" value={record.allowedDepartments?.join(', ')} />
        <DetailRow label="Job ID" value={record.jobId} />
      </div>
    </section>
    <section className="surface">
      <SectionHeading title="Applicants" />
      <ResourceState resource={applications} emptyTitle="No applications yet" emptyMessage="Students who apply for this job will appear here.">
        <div className="table-wrap"><table><thead><tr><th>Student</th><th>Enrollment no.</th><th>Applied</th><th>Status</th></tr></thead><tbody>{received.map((application) => { const student = studentFor(application); return <tr key={application.applicationId}><td><strong>{student?.studentName || 'Unknown student'}</strong><small>{student?.department || ''}</small></td><td>{application.studentId}</td><td>{formatDate(application.appliedDate)}</td><td><StatusBadge value={application.applicationStatus} /></td></tr> })}</tbody></table></div>
      </ResourceState>
    </section>
  </>
}

export function OfficerJobs() { const jobs = useFetch(endpoints.jobs); const companies = useFetch(endpoints.companies); return <><PageHeader eyebrow="Placement office" title="All job listings" description="Monitor the opportunity catalog and approval trail." /><ResourceState resource={jobs} emptyTitle="No jobs found" emptyMessage="Job listings will appear once recruiters publish roles."><div className="job-grid">{list(jobs.data).map((job) => <JobCard key={job.jobId} job={job} company={companyName(list(companies.data), job.companyId)} detailsPath={`/officer/jobs/${job.jobId}`} />)}</div></ResourceState></> }


export function NotFound() { return <div className="not-found"><span className="eyebrow">404 / Off track</span><h1>That page is not in this workspace.</h1><Link className="button button-dark" to="/">Return to Lakshya</Link></div> }

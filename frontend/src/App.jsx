import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { useAuth } from './auth/useAuth'
import LoginPage from './pages/LoginPage'
import RegisterRecruiterPage from './pages/RegisterRecruiterPage'
import { ApprovedRecruiterOnly } from './recruiter/RecruiterRegistration'
import RecruiterCompanyPage from './recruiter/RecruiterCompanyPage'
import RecruiterJobsPage from './recruiter/RecruiterJobsPage'
import { PendingRegistrationsPage, ReviewRegistrationPage } from './officer/PendingRegistrationsPage'
import {
	LandingPage, JobDetails, JobHiringDetails, NotFound, OfficerCompanies, OfficerDashboard,
	OfficerJobs, OfficerRecruiters, OfficerStudents, RecruiterApplicants,
	RecruiterDashboard, RecruiterInterviews, StudentApplications, StudentDashboard,
	StudentInterviews, StudentJobs, StudentNotifications, StudentProfile, StudentProjects, StudentResume,
} from './pages/Pages'
import './App.css'

function ProtectedRoute({ role, children }) {
	const { isAuthenticated, role: authenticatedRole } = useAuth()
	if (!isAuthenticated) return <Navigate to={`/login?role=${role}`} replace />
	if (authenticatedRole !== role) return <Navigate to={`/${authenticatedRole}/dashboard`} replace />
	return <AppShell role={role}>{children}</AppShell>
}

function App() {
	return <Routes>
		<Route path="/" element={<LandingPage />} />
		<Route path="/login" element={<LoginPage />} />
		<Route path="/register/recruiter" element={<RegisterRecruiterPage />} />
		<Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
		<Route path="/student/jobs" element={<ProtectedRoute role="student"><StudentJobs /></ProtectedRoute>} />
		<Route path="/student/jobs/:jobId" element={<ProtectedRoute role="student"><JobDetails /></ProtectedRoute>} />
		<Route path="/student/applications" element={<ProtectedRoute role="student"><StudentApplications /></ProtectedRoute>} />
		<Route path="/student/interviews" element={<ProtectedRoute role="student"><StudentInterviews /></ProtectedRoute>} />
		<Route path="/student/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />
		<Route path="/student/resume" element={<ProtectedRoute role="student"><StudentResume /></ProtectedRoute>} />
		<Route path="/student/projects" element={<ProtectedRoute role="student"><StudentProjects /></ProtectedRoute>} />
		<Route path="/student/notifications" element={<ProtectedRoute role="student"><StudentNotifications /></ProtectedRoute>} />
		<Route path="/recruiter/dashboard" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
		<Route path="/recruiter/company" element={<ProtectedRoute role="recruiter"><RecruiterCompanyPage /></ProtectedRoute>} />
		<Route path="/recruiter/jobs" element={<ProtectedRoute role="recruiter"><RecruiterJobsPage /></ProtectedRoute>} />
		<Route path="/recruiter/jobs/:jobId" element={<ProtectedRoute role="recruiter"><ApprovedRecruiterOnly><JobHiringDetails backTo="/recruiter/jobs" /></ApprovedRecruiterOnly></ProtectedRoute>} />
		<Route path="/recruiter/applicants" element={<ProtectedRoute role="recruiter"><ApprovedRecruiterOnly><RecruiterApplicants /></ApprovedRecruiterOnly></ProtectedRoute>} />
		<Route path="/recruiter/interviews" element={<ProtectedRoute role="recruiter"><ApprovedRecruiterOnly><RecruiterInterviews /></ApprovedRecruiterOnly></ProtectedRoute>} />
		<Route path="/officer/pending" element={<ProtectedRoute role="officer"><PendingRegistrationsPage /></ProtectedRoute>} />
		<Route path="/officer/pending/:recruiterId" element={<ProtectedRoute role="officer"><ReviewRegistrationPage /></ProtectedRoute>} />
		<Route path="/officer/dashboard" element={<ProtectedRoute role="officer"><OfficerDashboard /></ProtectedRoute>} />
		<Route path="/officer/jobs" element={<ProtectedRoute role="officer"><OfficerJobs /></ProtectedRoute>} />
		<Route path="/officer/jobs/:jobId" element={<ProtectedRoute role="officer"><JobHiringDetails backTo="/officer/jobs" /></ProtectedRoute>} />
		<Route path="/officer/companies" element={<ProtectedRoute role="officer"><OfficerCompanies /></ProtectedRoute>} />
		<Route path="/officer/recruiters" element={<ProtectedRoute role="officer"><OfficerRecruiters /></ProtectedRoute>} />
		<Route path="/officer/students" element={<ProtectedRoute role="officer"><OfficerStudents /></ProtectedRoute>} />
		<Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
		<Route path="/recruiter" element={<Navigate to="/recruiter/dashboard" replace />} />
		<Route path="/officer" element={<Navigate to="/officer/dashboard" replace />} />
		<Route path="*" element={<NotFound />} />
	</Routes>
}

export default App

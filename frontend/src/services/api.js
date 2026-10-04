import { API_BASE_URL } from '../config/appConfig'
import { getStoredToken } from '../auth/authStorage'

async function request(path, options = {}) {
  const token = getStoredToken()
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`)
    error.data = data
    throw error
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData }),
  replace: (path, formData) => request(path, { method: 'PUT', body: formData }),
}

export const endpoints = {
  students: '/students',
  registration: '/registration',
  companies: '/companies',
  recruiters: '/recruiters',
  jobs: '/jobs',
  applications: '/applications',
  interviews: '/interviews',
  officers: '/placement-officers',
  projects: '/projects',
  resumes: '/resumes',
  notifications: '/notifications',
}

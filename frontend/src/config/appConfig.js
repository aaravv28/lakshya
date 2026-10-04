export const API_BASE_URL = '/api'

// Must match backend/utils/departments.js; the server refuses any other name.
export const DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Instrumentation & Control',
]

export const formatDate = (value) => {
  if (!value) return 'Not specified'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value))
}

export const formatCurrency = (value) => {
  if (value === undefined || value === null || value === '') return 'Not specified'
  const amount = Number(value)
  return `${(amount >= 100000 ? amount / 100000 : amount).toFixed(1)} LPA`
}

export const titleCase = (value = '') =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())

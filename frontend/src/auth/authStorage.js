const AUTH_STORAGE_KEY = 'lakshya-auth'

export const readStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export const getStoredToken = () => readStoredAuth()?.token || ''

export const saveAuth = (session) => localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
export const clearAuth = () => localStorage.removeItem(AUTH_STORAGE_KEY)

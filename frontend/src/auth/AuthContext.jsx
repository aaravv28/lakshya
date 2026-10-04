import { useState } from 'react'
import { clearAuth, readStoredAuth, saveAuth } from './authStorage'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)

  const login = (session) => {
    saveAuth(session)
    setAuth(session)
  }

  const logout = () => {
    clearAuth()
    setAuth(null)
  }

  return <AuthContext.Provider value={{ ...auth, isAuthenticated: Boolean(auth?.token), login, logout }}>{children}</AuthContext.Provider>
}

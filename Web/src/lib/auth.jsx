import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

/** Decode a JWT and return the payload, or null if expired / invalid. */
function parseJwt(token) {
  try {
    // Handle base64url → base64
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore session from localStorage on first render
    const token = localStorage.getItem('access_token')
    if (!token) return null
    return parseJwt(token) // { id, fname, lname, email }
  })

  /** Call after a successful login or register API response. */
  function login(data) {
    localStorage.setItem('access_token', data.accessToken)
    if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken)
    // Use the user object from the API response; fall back to JWT decode
    setUser(data.user ?? parseJwt(data.accessToken))
  }

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { setAccessToken, authApi, type AuthUser } from '@/lib/api'

const TOKEN_KEY = 'groco_auth_token'

type AuthContextType = {
  isLoggedIn: boolean
  isLoading: boolean
  user: AuthUser | null
  token: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser]   = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY)
        if (stored) {
          setAccessToken(stored)
          const me = await authApi.me()
          setToken(stored)
          setUser(me)
        }
      } catch {
        SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})
        setAccessToken(null)
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [])

  const login = (t: string, u: AuthUser) => {
    setAccessToken(t)
    setToken(t)
    setUser(u)
    SecureStore.setItemAsync(TOKEN_KEY, t)
  }

  const logout = () => {
    setAccessToken(null)
    setToken(null)
    setUser(null)
    SecureStore.deleteItemAsync(TOKEN_KEY)
  }

  const refreshUser = async () => {
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn: token !== null, isLoading, user, token, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

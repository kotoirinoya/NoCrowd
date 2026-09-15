import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiClient } from '@/api/client'
import type { UserDTO } from '@shared/types'

interface AuthContextValue {
  user: UserDTO | null
  loading: boolean
  signup: (username: string, password: string) => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: UserDTO) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient
      .get<UserDTO>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const signup = useCallback(async (username: string, password: string) => {
    const result = await apiClient.post<UserDTO>('/auth/signup', { username, password })
    setUser(result)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiClient.post<UserDTO>('/auth/login', { username, password })
    setUser(result)
  }, [])

  const logout = useCallback(async () => {
    await apiClient.post('/auth/logout')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "cashier" | "manager" | "admin"

export interface User {
  id: string
  username: string
  role: UserRole
  name: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for demo purposes
const mockUsers: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin123",
    user: { id: "1", username: "admin", role: "admin", name: "Admin User" },
  },
  manager: {
    password: "manager123",
    user: { id: "2", username: "manager", role: "manager", name: "Manager User" },
  },
  cashier: {
    password: "cashier123",
    user: { id: "3", username: "cashier", role: "cashier", name: "Cashier User" },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("pos-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const userRecord = mockUsers[username]
    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user)
      localStorage.setItem("pos-user", JSON.stringify(userRecord.user))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("pos-user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

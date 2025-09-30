"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "./supabase/client"

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
  addUser: (username: string, password: string, name: string, role: UserRole) => Promise<boolean>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("pos-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, role, name, password")
      .eq("username", username)
      .single()

    if (error || !data) return false

    // ⚠️ Replace with hashed password check in production
    if (data.password === password) {
      const userObj: User = { id: data.id, username: data.username, role: data.role, name: data.name }
      setUser(userObj)
      localStorage.setItem("pos-user", JSON.stringify(userObj))
      return true
    }
    return false
  }

  const addUser = async (username: string, password: string, name: string, role: UserRole): Promise<boolean> => {
    try {
      const { error } = await supabase.from("users").insert([{ username, password, name, role }])
      if (error) throw error
      return true
    } catch (err) {
      console.error("Error adding user:", err)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("pos-user")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, addUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import Image from "next/image"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await login(username, password)
    if (!success) {
      setError("Invalid username or password")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-pink-300 via-violet-300 to-pink-200 rounded-full p-3 flex items-center justify-center shadow-sm">
              <Image
                src="/amari-logo1.png"
                alt="Amari's Scoops & Savours Logo"
                width={64}
                height={64}
                className="object-contain rounded-full"
              />
            </div>
          </div>

          <CardTitle className="text-2xl font-bold text-primary">
            Amari's Scoops & Savours
          </CardTitle>
          <CardDescription>Sign in to access the system</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <div className="text-destructive text-sm text-center">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            <p className="text-center mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs">
              <p>Admin: admin / admin123</p>
              <p>Manager: manager / manager123</p>
              <p>Cashier: cashier / cashier123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Store, Users, Bell, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export function Settings() {
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    role: "cashier" as "cashier" | "manager" | "admin",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setNewUser((prev) => ({ ...prev, [id]: value }))
  }

  const handleRoleChange = (value: "cashier" | "manager" | "admin") => {
    setNewUser((prev) => ({ ...prev, role: value }))
  }

  const handleAddUser = async () => {
    const { firstName, lastName, username, password, role } = newUser
    if (!firstName || !lastName || !username || !password || !role) {
      alert("Please fill in all fields for the new user.")
      return
    }

    try {
      const { error } = await supabase.from("users").insert([
        {
          name: `${firstName} ${lastName}`,
          username,
          password, // Note: In a real app, hash the password before storing
          role,
        },
      ])

      if (error) throw error

      alert(`User "${username}" created successfully!`)
      setNewUser({
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        role: "cashier",
      })
    } catch (error: any) {
      console.error("Error adding user:", error)
      alert(`Failed to add user: ${error.message}`)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your POS system configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Juan" value={newUser.firstName} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Dela Cruz" value={newUser.lastName} onChange={handleInputChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="juandelacruz" value={newUser.username} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter password" value={newUser.password} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddUser}>Add User</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="low-stock">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
              </div>
              <Switch id="low-stock" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="daily-reports">Daily Sales Reports</Label>
                <p className="text-sm text-muted-foreground">Receive daily sales summary emails</p>
              </div>
              <Switch id="daily-reports" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="transaction-alerts">Transaction Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified of large transactions</p>
              </div>
              <Switch id="transaction-alerts" />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

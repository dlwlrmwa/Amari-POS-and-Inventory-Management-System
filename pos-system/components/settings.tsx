"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Store, Users, Bell, Shield, Edit2, Trash2, Plus, ChevronDown, LogIn, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth"
import { formatDateManilaTime } from "@/lib/utils"

export function Settings() {
  const { user } = useAuth()
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdminUser, setIsAdminUser] = useState(false)

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    role: "cashier" as "cashier" | "manager" | "admin",
  })

  const [editingUser, setEditingUser] = useState<any>(null)
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null)
  const [selectedAuditAction, setSelectedAuditAction] = useState("all")
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [deleteLogId, setDeleteLogId] = useState<number | null>(null)
  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set())
  const [isLeftHanded, setIsLeftHanded] = useState(false)

  useEffect(() => {
    setIsAdminUser(user?.role === "admin")
    loadUsers()
    loadAuditLogs()
    // Load left-handed preference from localStorage
    const savedLeftHanded = localStorage.getItem("isLeftHanded") === "true"
    setIsLeftHanded(savedLeftHanded)
  }, [user])

  const handleLeftHandedToggle = (checked: boolean) => {
    setIsLeftHanded(checked)
    localStorage.setItem("isLeftHanded", checked.toString())
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("is_active", true)
      if (error) throw error
      setAllUsers(data || [])
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw error
      setAuditLogs(data || [])
    } catch (error) {
      console.error("Error loading audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const { id, value } = e.target
    if (isEdit && editingUser) {
      setEditingUser((prev: any) => ({ ...prev, [id]: value }))
    } else {
      setNewUser((prev) => ({ ...prev, [id]: value }))
    }
  }

  const handleRoleChange = (value: "cashier" | "manager" | "admin", isEdit = false) => {
    if (isEdit && editingUser) {
      setEditingUser((prev: any) => ({ ...prev, role: value }))
    } else {
      setNewUser((prev) => ({ ...prev, role: value }))
    }
  }

  const handleAddUser = async () => {
    const { firstName, lastName, username, password, role, email, phone } = newUser
    if (!firstName || !lastName || !username || !password || !role) {
      alert("Please fill in all required fields for the new user.")
      return
    }

    try {
      const { error } = await supabase.from("users").insert([
        {
          name: `${firstName} ${lastName}`,
          username,
          password,
          role,
          email: email || null,
          phone: phone || null,
        },
      ])

      if (error) throw error

      alert(`User "${username}" created successfully!`)
      setNewUser({
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        email: "",
        phone: "",
        role: "cashier",
      })
      loadUsers()
      loadAuditLogs()
    } catch (error: any) {
      console.error("Error adding user:", error)
      alert(`Failed to add user: ${error.message}`)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const updateData: any = {
        name: editingUser.name,
        email: editingUser.email || null,
        phone: editingUser.phone || null,
        role: editingUser.role,
      }

      const { error } = await supabase.from("users").update(updateData).eq("id", editingUser.id)

      if (error) throw error

      alert("User updated successfully!")
      setEditingUser(null)
      loadUsers()
      loadAuditLogs()
    } catch (error: any) {
      console.error("Error updating user:", error)
      alert(`Failed to update user: ${error.message}`)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserId) return

    try {
      const { error } = await supabase.from("users").delete().eq("id", deleteUserId)

      if (error) throw error

      alert("User deleted successfully!")
      setDeleteUserId(null)
      setSelectedUserInfo(null)
      loadUsers()
      loadAuditLogs()
    } catch (error: any) {
      console.error("Error deleting user:", error)
      alert(`Failed to delete user: ${error.message}`)
    }
  }

  const handleChangePassword = async (userId: number) => {
    if (!newPassword.trim()) {
      alert("Please enter a new password")
      return
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ password: newPassword })
        .eq("id", userId)

      if (error) throw error

      alert("Password changed successfully!")
      setNewPassword("")
      loadUsers()
    } catch (error: any) {
      console.error("Error changing password:", error)
      alert(`Failed to change password: ${error.message}`)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <LogIn className="h-4 w-4 text-blue-500" />
      case "SALE":
        return <Zap className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const filteredLogs = auditLogs.filter(
    (log) => selectedAuditAction === "all" || log.action === selectedAuditAction
  )

  const handleDeleteLog = async (logId: number) => {
    try {
      const { error } = await supabase.from("audit_logs").delete().eq("id", logId)
      if (error) throw error
      alert("Audit log deleted successfully!")
      setDeleteLogId(null)
      loadAuditLogs()
    } catch (error: any) {
      console.error("Error deleting audit log:", error)
      alert(`Failed to delete audit log: ${error.message}`)
    }
  }

  const handleDeleteMultipleLogs = async () => {
    if (selectedLogs.size === 0) {
      alert("Please select logs to delete")
      return
    }
    try {
      const logIds = Array.from(selectedLogs)
      const { error } = await supabase.from("audit_logs").delete().in("id", logIds)
      if (error) throw error
      alert(`${logIds.length} audit log(s) deleted successfully!`)
      setSelectedLogs(new Set())
      loadAuditLogs()
    } catch (error: any) {
      console.error("Error deleting audit logs:", error)
      alert(`Failed to delete audit logs: ${error.message}`)
    }
  }

  const toggleLogSelection = (logId: number) => {
    const newSelected = new Set(selectedLogs)
    if (newSelected.has(logId)) {
      newSelected.delete(logId)
    } else {
      newSelected.add(logId)
    }
    setSelectedLogs(newSelected)
  }

  const toggleSelectAllLogs = () => {
    if (selectedLogs.size === filteredLogs.length) {
      setSelectedLogs(new Set())
    } else {
      setSelectedLogs(new Set(filteredLogs.map(log => log.id)))
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {isAdminUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New User Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create New User</span>
              </CardTitle>
              <CardDescription>Add a new staff member to the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={handleInputChange}
                    placeholder="Eliza"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={handleInputChange}
                    placeholder="Abing"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="elizaabing"
                  value={newUser.username}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="eliza@example.com"
                  value={newUser.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+63 908 818 4444"
                  value={newUser.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={newUser.password}
                    onChange={handleInputChange}
                  />
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
              </div>
              <Button onClick={handleAddUser} className="whitespace-nowrap">
                Create User
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
                <CardDescription className="text-xs">Configure preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="low-stock" className="text-xs">Low Stock Alerts</Label>
                    <p className="text-xs text-muted-foreground">When products run low</p>
                  </div>
                  <Switch id="low-stock" defaultChecked />
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <Label htmlFor="left-handed" className="text-xs">Left-Handed Mode</Label>
                    <p className="text-xs text-muted-foreground">Place cart on left side</p>
                  </div>
                  <Switch
                    id="left-handed"
                    checked={isLeftHanded}
                    onCheckedChange={handleLeftHandedToggle}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Stats */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">System Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{allUsers.length}</p>
                </div>
                <div className="border-t pt-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">Admins</p>
                      <p className="text-sm font-semibold">{allUsers.filter(u => u.role === "admin").length}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">Managers</p>
                      <p className="text-sm font-semibold">{allUsers.filter(u => u.role === "manager").length}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">Cashiers</p>
                      <p className="text-sm font-semibold">{allUsers.filter(u => u.role === "cashier").length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Notifications for non-admin users */}
      {!isAdminUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-lg font-bold">{user?.name}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="text-sm font-medium mt-1">{user?.username}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium mt-1 capitalize">{user?.role}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription className="text-xs">Configure preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="low-stock-cashier" className="text-xs">Low Stock Alerts</Label>
                  <p className="text-xs text-muted-foreground">When products run low</p>
                </div>
                <Switch id="low-stock-cashier" defaultChecked />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <Label htmlFor="left-handed-cashier" className="text-xs">Left-Handed Mode</Label>
                  <p className="text-xs text-muted-foreground">Place cart on left side</p>
                </div>
                <Switch
                  id="left-handed-cashier"
                  checked={isLeftHanded}
                  onCheckedChange={handleLeftHandedToggle}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users List - Full Width Below */}
      {isAdminUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User List ({allUsers.length})</span>
            </CardTitle>
            <CardDescription>Manage existing user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {allUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No users found</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {allUsers.map((userItem) => (
                  <div
                    key={userItem.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-sm">{userItem.name}</p>
                        <Badge variant="outline" className="text-xs">{userItem.role}</Badge>
                        {userItem.is_active && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{userItem.username}</p>
                      {userItem.email && (
                        <p className="text-xs text-muted-foreground">{userItem.email}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedUserInfo(userItem)
                      }}
                      className="ml-4 whitespace-nowrap"
                    >
                      View Information
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Information Modal */}
      <Dialog open={!!selectedUserInfo} onOpenChange={(open) => {
        if (!open) {
          setSelectedUserInfo(null)
          setNewPassword("")
        }
      }}>
        {selectedUserInfo && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Information</DialogTitle>
              <DialogDescription>View and manage user details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Full Name</Label>
                  <p className="text-sm font-medium mt-1">{selectedUserInfo.name}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Username</Label>
                  <p className="text-sm mt-1">{selectedUserInfo.username}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                  <p className="text-sm mt-1">{selectedUserInfo.email || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Phone</Label>
                  <p className="text-sm mt-1">{selectedUserInfo.phone || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Role</Label>
                  <p className="text-sm mt-1">
                    <Badge variant="outline">{selectedUserInfo.role}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
                  <p className="text-sm mt-1">
                    {selectedUserInfo.is_active ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedUserInfo(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setEditingUser({ ...selectedUserInfo })
                  setShowEditDialog(true)
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Information
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEditDialog(false)
          setEditingUser(null)
        }
      }}>
        {editingUser && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User Information</DialogTitle>
              <DialogDescription>Update user details and role</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingUser.phone || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editingUser.role || ""}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value })
                  }
                >
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
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-semibold">Change Password</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      handleChangePassword(editingUser.id)
                      setNewPassword("")
                    }}
                    className="whitespace-nowrap"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="flex w-full justify-between">
              <AlertDialog open={deleteUserId === selectedUserInfo?.id} onOpenChange={() => setDeleteUserId(null)}>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteUserId(selectedUserInfo.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete User
                </Button>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete{" "}
                      <span className="font-semibold">{selectedUserInfo.name}</span>? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogAction
                    onClick={handleDeleteUser}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>

                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={() => {
                  handleUpdateUser();
                  setShowEditDialog(false);
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>

          </DialogContent>
        )}
      </Dialog>

      {/* Audit Logs Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Audit Logs</span>
              </CardTitle>
              <CardDescription>System activity and user actions</CardDescription>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Select value={selectedAuditAction} onValueChange={setSelectedAuditAction}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Logins</SelectItem>
                  <SelectItem value="SALE">Sales</SelectItem>
                  <SelectItem value="VOID">Voids</SelectItem>
                  <SelectItem value="PAYMENT_PROCESSING">Payments</SelectItem>
                  <SelectItem value="USER_CREATE">User Created</SelectItem>
                  <SelectItem value="USER_UPDATE">User Updated</SelectItem>
                  <SelectItem value="STOCK_ADJUSTMENT">Stock Changes</SelectItem>
                </SelectContent>
              </Select>
              {isAdminUser && selectedLogs.size > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteMultipleLogs}
                  className="whitespace-nowrap"
                >
                  Delete Selected ({selectedLogs.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No audit logs yet</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {isAdminUser && (
                <div className="flex items-center gap-2 pb-2 border-b sticky top-0 bg-background">
                  <input
                    type="checkbox"
                    checked={selectedLogs.size === filteredLogs.length && filteredLogs.length > 0}
                    onChange={toggleSelectAllLogs}
                    className="rounded border-gray-300"
                    title="Select all visible logs"
                  />
                  <span className="text-xs text-muted-foreground">
                    {selectedLogs.size > 0 ? `${selectedLogs.size} selected` : "Select all"}
                  </span>
                </div>
              )}
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {isAdminUser && (
                      <input
                        type="checkbox"
                        checked={selectedLogs.has(log.id)}
                        onChange={() => toggleLogSelection(log.id)}
                        className="mt-1 rounded border-gray-300"
                      />
                    )}
                    {getActionIcon(log.action)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{log.username || "System"}</p>
                        <Badge variant="secondary" className="text-xs">{log.action}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{log.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateManilaTime(log.created_at)}
                      </p>
                    </div>
                  </div>
                  {isAdminUser && (
                    <AlertDialog open={deleteLogId === log.id} onOpenChange={() => setDeleteLogId(null)}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteLogId(log.id)}
                        className="ml-2 h-15 w-10 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Audit Log</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this audit log? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogAction
                          onClick={() => handleDeleteLog(log.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


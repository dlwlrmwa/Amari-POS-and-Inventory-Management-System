"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { POSInterface } from "@/components/pos-interface"
import { InventoryManagement } from "@/components/inventory-management"
import { SalesReports } from "@/components/sales-reports"
import { Settings } from "@/components/settings"

function AppContent() {
  const { user, isLoading } = useAuth()
  const [activeView, setActiveView] = useState(() => {
    // Default view based on user role
    if (user?.role === "cashier") return "pos"
    return "dashboard"
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />
      case "pos":
        return <POSInterface />
      case "inventory":
        return <InventoryManagement />
      case "reports":
        return <SalesReports />
      case "settings":
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-auto">{renderView()}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

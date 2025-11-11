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
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

function AppContent() {
  const { user, isLoading } = useAuth()
  const [activeView, setActiveView] = useState(() => {
    // Default view based on user role
    if (user?.role === "cashier") return "pos"
    return "dashboard"
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

  const handleViewChange = (view: string) => {
    setActiveView(view)
    setIsSidebarOpen(false) // Close sidebar on view change in mobile
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      </div>

      {/* Mobile Header & Sidebar */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar activeView={activeView} onViewChange={handleViewChange} />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold capitalize">{activeView}</h1>
        </header>

        <main className="flex-1 overflow-auto">{renderView()}</main>
      </div>
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

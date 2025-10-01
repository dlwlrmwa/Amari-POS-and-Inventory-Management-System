"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Settings, LogOut, User } from "lucide-react"

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user, logout } = useAuth()

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["manager", "admin", "cashier"],
    },
    {
      id: "pos",
      label: "Point of Sale",
      icon: ShoppingCart,
      roles: ["cashier", "manager", "admin"],
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
      roles: ["manager", "admin"],
    },
    {
      id: "reports",
      label: "Sales Reports",
      icon: BarChart3,
      roles: ["manager", "admin"],
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      roles: ["admin"],
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user?.role || ""))

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="bg-primary rounded-lg p-2">
            <ShoppingCart className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Amari Scoops & Savors</h1>
            <p className="text-sm text-muted-foreground">POS with Inventory Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeView === item.id && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-muted rounded-full p-2">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

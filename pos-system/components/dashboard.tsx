"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, Clock, Eye } from "lucide-react"

// Mock data for dashboard metrics
const dashboardData = {
  todaySales: 2847.5,
  totalTransactions: 127,
  lowStockItems: 8,
  totalProducts: 342,
  salesGrowth: 12.5,
  topProducts: [
    { name: "Coffee Beans Premium", sold: 45, revenue: 675.0 },
    { name: "Wireless Headphones", sold: 23, revenue: 2300.0 },
    { name: "Organic Tea Set", sold: 31, revenue: 465.0 },
  ],
  lowStockAlerts: [
    { name: "Coffee Beans Premium", stock: 5, minStock: 20 },
    { name: "Paper Cups", stock: 12, minStock: 50 },
    { name: "Sugar Packets", stock: 8, minStock: 100 },
  ],
  recentTransactions: [
    { id: "TXN-001", time: "2 min ago", amount: 24.5, items: 3 },
    { id: "TXN-002", time: "5 min ago", amount: 156.0, items: 2 },
    { id: "TXN-003", time: "8 min ago", amount: 89.75, items: 5 },
  ],
}

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${dashboardData.todaySales.toFixed(2)}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span>+{dashboardData.salesGrowth}% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Total transactions today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dashboardData.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Top Selling Products Today</span>
            </CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sold} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Transactions</span>
            </CardTitle>
            <CardDescription>Latest sales activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{transaction.id}</p>
                    <p className="text-xs text-muted-foreground">{transaction.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">${transaction.amount}</p>
                    <p className="text-xs text-muted-foreground">{transaction.items} items</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All Transactions
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Low Stock Alerts</span>
          </CardTitle>
          <CardDescription>Products that need immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.lowStockAlerts.map((item, index) => (
              <div key={index} className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{item.name}</h4>
                  <Badge variant="destructive">Low Stock</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current: {item.stock}</span>
                    <span>Min: {item.minStock}</span>
                  </div>
                  <Progress value={(item.stock / item.minStock) * 100} className="h-2" />
                  <Button size="sm" className="w-full">
                    Restock Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, Clock, Eye } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getLowStockProducts } from "@/lib/data/products"
import { getTodaysSales, getSalesStats } from "@/lib/data/sales"
import type { Product, Sale } from "@/lib/supabase/client"

export function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [todaySales, setTodaySales] = useState<Sale[]>([])
  const [lowStockItems, setLowStockItems] = useState<Product[]>([])
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageOrderValue: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [salesData, lowStockData, statsData] = await Promise.all([
        getTodaysSales(),
        getLowStockProducts(),
        getSalesStats()
      ])
      setTodaySales(salesData)
      setLowStockItems(lowStockData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTodaysTotalSales = () => {
    return todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₱{getTodaysTotalSales().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{todaySales.length} transactions today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Today's sales activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{sale.id}</p>
                    <p className="text-sm text-muted-foreground">{sale.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">₱{sale.totalAmount.toFixed(2)}</p>
                    <Badge variant="outline">{sale.paymentMethod}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Low Stock Alerts</span>
            </CardTitle>
            <CardDescription>Products need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

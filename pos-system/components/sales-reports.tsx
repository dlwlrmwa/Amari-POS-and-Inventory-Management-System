"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Download, Calendar, DollarSign, ShoppingCart, TrendingUp, FileText } from "lucide-react"

// Mock sales data
const dailySalesData = [
  { date: "Mon", sales: 1250, transactions: 45 },
  { date: "Tue", sales: 1890, transactions: 67 },
  { date: "Wed", sales: 2340, transactions: 89 },
  { date: "Thu", sales: 1670, transactions: 56 },
  { date: "Fri", sales: 2847, transactions: 127 },
  { date: "Sat", sales: 3120, transactions: 145 },
  { date: "Sun", sales: 2680, transactions: 98 },
]

const weeklySalesData = [
  { week: "Week 1", sales: 12450, transactions: 456 },
  { week: "Week 2", sales: 15670, transactions: 578 },
  { week: "Week 3", sales: 18920, transactions: 689 },
  { week: "Week 4", sales: 16780, transactions: 612 },
]

const topProductsData = [
  { name: "Coffee Beans Premium", sales: 45, revenue: 675.0 },
  { name: "Wireless Headphones", sales: 23, revenue: 2300.0 },
  { name: "Organic Tea Set", sales: 31, revenue: 465.0 },
  { name: "Bluetooth Speaker", sales: 18, revenue: 1440.0 },
  { name: "Notebook Premium", sales: 28, revenue: 364.0 },
]

const recentTransactions = [
  {
    id: "TXN-2024-001",
    date: "2024-01-15",
    time: "14:30",
    customer: "John Doe",
    items: 3,
    amount: 124.5,
    paymentMethod: "Card",
    status: "Completed",
  },
  {
    id: "TXN-2024-002",
    date: "2024-01-15",
    time: "14:25",
    customer: "Jane Smith",
    items: 2,
    amount: 89.99,
    paymentMethod: "Cash",
    status: "Completed",
  },
  {
    id: "TXN-2024-003",
    date: "2024-01-15",
    time: "14:20",
    customer: "Mike Johnson",
    items: 5,
    amount: 234.75,
    paymentMethod: "Card",
    status: "Completed",
  },
  {
    id: "TXN-2024-004",
    date: "2024-01-15",
    time: "14:15",
    customer: "Sarah Wilson",
    items: 1,
    amount: 15.99,
    paymentMethod: "Cash",
    status: "Completed",
  },
  {
    id: "TXN-2024-005",
    date: "2024-01-15",
    time: "14:10",
    customer: "David Brown",
    items: 4,
    amount: 178.25,
    paymentMethod: "Card",
    status: "Completed",
  },
]

export function SalesReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily")
  const [selectedChart, setSelectedChart] = useState("sales")

  const chartData = selectedPeriod === "daily" ? dailySalesData : weeklySalesData

  const totalSales = chartData.reduce((sum, item) => sum + item.sales, 0)
  const totalTransactions = chartData.reduce((sum, item) => sum + item.transactions, 0)
  const averageOrderValue = totalSales / totalTransactions

  const handleExportData = () => {
    // Mock export functionality
    alert("Sales report exported successfully!")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Reports</h1>
          <p className="text-muted-foreground">Analyze your sales performance and trends</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportData} variant="outline" className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{selectedPeriod === "daily" ? "This week" : "This month"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">+12.5%</div>
            <p className="text-xs text-muted-foreground">vs last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>{selectedPeriod === "daily" ? "Daily" : "Weekly"} sales performance</CardDescription>
              </div>
              <Select value={selectedChart} onValueChange={setSelectedChart}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales ($)</SelectItem>
                  <SelectItem value="transactions">Transactions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {selectedChart === "sales" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={selectedPeriod === "daily" ? "date" : "week"} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, "Sales"]} />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={selectedPeriod === "daily" ? "date" : "week"} />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "Transactions"]} />
                  <Line type="monotone" dataKey="transactions" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProductsData.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Recent Transactions</span>
              </CardTitle>
              <CardDescription>Latest sales transactions and order details</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="bg-transparent">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{transaction.date}</p>
                      <p className="text-sm text-muted-foreground">{transaction.time}</p>
                    </div>
                  </TableCell>
                  <TableCell>{transaction.customer}</TableCell>
                  <TableCell>{transaction.items}</TableCell>
                  <TableCell className="font-bold">${transaction.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.paymentMethod === "Card" ? "default" : "secondary"}>
                      {transaction.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

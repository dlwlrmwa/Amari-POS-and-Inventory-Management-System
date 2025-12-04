"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import {
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  FileText,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Sale } from "@/lib/supabase/client"
import { getSales, getSalesStats } from "@/lib/data/sales"
import { exportSalesToExcel } from "@/lib/utils/export"
import { supabase } from "@/lib/supabase/client"

export function SalesReports() {
  const { toast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    topProducts: [] as any[],
  })
  const [selectedPeriod, setSelectedPeriod] = useState("daily")
  const [selectedChart, setSelectedChart] = useState("sales")
  const [chartData, setChartData] = useState<any[]>([])
  const [growthRate, setGrowthRate] = useState(0)

  useEffect(() => {
    loadSales()
    loadReports()
  }, [selectedPeriod])

  const loadSales = async () => {
    try {
      setLoading(true)
      const [salesData, statsData] = await Promise.all([
        getSales(10),
        getSalesStats(),
      ])
      setSales(salesData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading sales:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadReports = async () => {
    try {
      let tableName = "daily_sales_summary"

      if (selectedPeriod === "weekly") {
        tableName = "weekly_sales_summary"
      } else if (selectedPeriod === "monthly") {
        tableName = "monthly_sales_summary"
      }

      const { data: reportData, error: reportError } = await supabase
        .from(tableName)
        .select("*")
        .order("date", { ascending: true })

      if (reportError) throw reportError
      setChartData(reportData || [])

      if (reportData && reportData.length >= 2) {
        const last = reportData[reportData.length - 1].total_sales
        const prev = reportData[reportData.length - 2].total_sales
        if (prev > 0) {
          setGrowthRate(((last - prev) / prev) * 100)
        }
      }
    } catch (error) {
      console.error("Error loading reports:", error)
    }
  }

  const handleExportExcel = async () => {
    try {
      let reportName = "sales-report"

      if (selectedPeriod === "daily") {
        await exportSalesToExcel(sales, reportName)
      } else {
        // For weekly and monthly, export chart data as CSV
        const dataToExport = chartData.map(item => ({
          date: item.date,
          total_sales: item.total_sales,
          transaction_count: item.transaction_count
        }))

        reportName = selectedPeriod === "weekly" ? "weekly-sales-report" : "monthly-sales-report"

        // Create CSV export
        const csv = [
          ["Date", "Total Sales", "Transaction Count"],
          ...dataToExport.map(item => [item.date, item.total_sales, item.transaction_count])
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `${reportName}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toast({
        title: "Export Successful",
        description: `Your ${selectedPeriod} sales report has been downloaded.`,
      })
    } catch (error) {
      console.error("Failed to export:", error)
      toast({
        title: "Export Failed",
        description: "Could not generate the export file. Please try again.",
        variant: "destructive",
      })
    }
  }


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading sales data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
        <div className="flex items-center space-x-2 md:ml-auto">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportExcel} className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₱{stats.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
              {growthRate >= 0 ? "+" : ""}
              {growthRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">vs last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  {selectedPeriod === "daily" ? "Daily" : selectedPeriod === "weekly" ? "Weekly" : "Monthly"} sales performance
                </CardDescription>
              </div>
              <Select value={selectedChart} onValueChange={setSelectedChart}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales (₱)</SelectItem>
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
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₱${Number(value).toFixed(2)}`, "Sales"]} />
                  <Bar dataKey="total_sales" fill="hsl(var(--primary))" />
                </BarChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "Transactions"]} />
                  <Line
                    type="monotone"
                    dataKey="transaction_count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </BarChart>
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
              {stats.topProducts.length === 0 ? (
                <p className="text-muted-foreground text-center">No product sales yet</p>
              ) : (
                stats.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.total_quantity_sold} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₱{product.total_revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
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
          </div>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                {sales.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-sm">{transaction.id}</span>
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 border-green-200"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-bold text-lg">₱{transaction.totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>{transaction.date} - {transaction.time}</p>
                        <p>Payment: {transaction.paymentMethod}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.date}</p>
                            <p className="text-sm text-muted-foreground">{transaction.time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{transaction.staffName || 'Unknown'}</p>
                        </TableCell>
                        <TableCell className="font-bold">₱{transaction.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={transaction.paymentMethod === "E-Payment" ? "default" : "default"}
                          >
                            {transaction.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800 border-green-200"
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
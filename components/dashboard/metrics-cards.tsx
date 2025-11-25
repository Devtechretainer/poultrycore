"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, DollarSign, CheckSquare, Package, Egg, Bird, Activity, TrendingUp as ProfitIcon } from "lucide-react"
import { getDashboardSummary, type DashboardSummary } from "@/lib/api/dashboard"
import { getSales } from "@/lib/api"
import { getUserContext } from "@/lib/utils/user-context"
import { formatCurrency } from "@/lib/utils/currency"

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: "increase" | "decrease" | "neutral"
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

function MetricCard({ title, value, change, changeType, icon: Icon, iconColor }: MetricCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{value}</p>
            <div className="flex items-center">
              {changeType === "increase" && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
              {changeType === "decrease" && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
              <span className={`text-sm font-medium ${
                changeType === "increase" ? "text-green-600" : 
                changeType === "decrease" ? "text-red-600" : 
                "text-slate-600"
              }`}>
                {change}
              </span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-full ${iconColor} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MetricsCards() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [salesData, setSalesData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const { farmId, userId } = getUserContext()
    
    if (!farmId) {
      setError("Farm ID not found")
      setLoading(false)
      return
    }

    if (!userId) {
      setError("User ID not found")
      setLoading(false)
      return
    }

    try {
      // Load dashboard summary and sales data in parallel
      const [summaryResult, salesResult] = await Promise.all([
        getDashboardSummary(farmId, userId),
        getSales(userId, farmId)
      ])
      
      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data)
      } else {
        setError(summaryResult.message)
      }

      if (salesResult.success && salesResult.data) {
        setSalesData(salesResult.data)
      }
    } catch (error) {
      setError("Failed to load dashboard data")
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="bg-white">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-8 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white col-span-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading dashboard data: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white col-span-full">
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">No dashboard data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Safe value extraction with fallbacks
  const safeValue = (value: any, fallback: number = 0) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value
    }
    return fallback
  }

  // Calculate sales metrics
  const calculateSalesMetrics = () => {
    if (!salesData || !Array.isArray(salesData)) {
      return {
        totalSales: 0,
        totalTransactions: 0,
        averageSale: 0,
        thisMonthSales: 0
      }
    }

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const totalSales = salesData.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0)
    const totalTransactions = salesData.length
    const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0

    const thisMonthSales = salesData
      .filter((sale: any) => {
        const saleDate = new Date(sale.saleDate)
        return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear
      })
      .reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0)

    return {
      totalSales,
      totalTransactions,
      averageSale,
      thisMonthSales
    }
  }

  const salesMetrics = calculateSalesMetrics()

  // Calculate percentage changes (mock calculations for now)
  const metrics = [
    {
      title: "TOTAL CUSTOMERS",
      value: safeValue(summary.totalCustomers).toLocaleString(),
      change: "↑ 12% Since last month",
      changeType: "increase" as const,
      icon: Users,
      iconColor: "bg-blue-500"
    },
    {
      title: "TOTAL PRODUCTION",
      value: safeValue(summary.totalProduction).toLocaleString(),
      change: "↑ 8% Since last month",
      changeType: "increase" as const,
      icon: Activity,
      iconColor: "bg-green-500"
    },
    {
      title: "TOTAL EGGS",
      value: safeValue(summary.totalEggs).toLocaleString(),
      change: "↑ 15% Since last month",
      changeType: "increase" as const,
      icon: Egg,
      iconColor: "bg-orange-500"
    },
    {
      title: "ACTIVE FLOCKS",
      value: safeValue(summary.activeFlocks).toString(),
      change: "↑ 2 Since last month",
      changeType: "increase" as const,
      icon: Bird,
      iconColor: "bg-purple-500"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="TOTAL SALES"
          value={formatCurrency(salesMetrics.totalSales)}
          change={`${salesMetrics.totalTransactions} transactions`}
          changeType="neutral"
          icon={DollarSign}
          iconColor="bg-green-600"
        />
        <MetricCard
          title="THIS MONTH SALES"
          value={formatCurrency(salesMetrics.thisMonthSales)}
          change="↑ 18% Since last month"
          changeType="increase"
          icon={TrendingUp}
          iconColor="bg-blue-600"
        />
        <MetricCard
          title="AVERAGE SALE"
          value={formatCurrency(salesMetrics.averageSale)}
          change="↑ 5% Since last month"
          changeType="increase"
          icon={Package}
          iconColor="bg-purple-500"
        />
        <MetricCard
          title="PRODUCTION EFFICIENCY"
          value={`${safeValue(summary.productionEfficiency).toFixed(1)}%`}
          change="↑ 2.1% Since last month"
          changeType="increase"
          icon={CheckSquare}
          iconColor="bg-indigo-500"
        />
      </div>
    </div>
  )
}
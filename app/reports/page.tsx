"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { BarChart3, Plus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { format } from "date-fns"
import { getReportContext, type ReportRequest } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { getProductionRecords, type ProductionRecord } from "@/lib/api/production-record"
import { getSales, type Sale } from "@/lib/api/sale"
import { getExpenses, type Expense } from "@/lib/api/expense"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from "recharts"

export default function ReportsPage() {
  const router = useRouter()
  const [reportRequest, setReportRequest] = useState<ReportRequest>({
    farmId: "",
    userId: "",
    reportType: "",
    startDate: "",
    endDate: "",
    flockId: undefined,
    customerId: undefined,
  })
  const { toast } = useToast()
  const [tab, setTab] = useState("production")
  const [records, setRecords] = useState<ProductionRecord[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize with user context
    const { farmId, userId } = getReportContext()
    setReportRequest(prev => ({
      ...prev,
      farmId,
      userId,
    }))
  }, [])

  // Build datasets
  const prodDaily = records
    .map((r: any) => ({ date: new Date(r.date).toLocaleDateString(), total: r.totalProduction || 0 }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const prodByTime = records.map((r: any) => ({
    date: new Date(r.date).toLocaleDateString(),
    m9: r.production9AM || 0,
    m12: r.production12PM || 0,
    m4: r.production4PM || 0,
  }))
  const revenueByDate = sales.reduce((acc: any[], s: any) => {
    const date = new Date(s.saleDate || s.sale_date).toLocaleDateString()
    const found = acc.find((x) => x.date === date)
    if (found) found.revenue += Number(s.totalAmount || 0)
    else acc.push({ date, revenue: Number(s.totalAmount || 0), expenses: 0 })
    return acc
  }, [])
  expenses.forEach((e: any) => {
    const date = new Date(e.expenseDate || e.expense_date).toLocaleDateString()
    const found = revenueByDate.find((x) => x.date === date)
    if (found) found.expenses += Number(e.amount || 0)
    else revenueByDate.push({ date, revenue: 0, expenses: Number(e.amount || 0) })
  })
  revenueByDate.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Load production records from API
  useEffect(() => {
    const load = async () => {
      try {
        const { userId, farmId } = getReportContext()
        if (!userId || !farmId) return
        const res = await getProductionRecords(userId, farmId)
        if (res.success && res.data) setRecords(res.data)
        else toast({ title: "Failed to fetch", description: res.message || "Could not load records", variant: "destructive" })
        const s = await getSales(userId, farmId)
        if (s.success && s.data) setSales(s.data)
        const e = await getExpenses(userId, farmId)
        if (e.success && e.data) setExpenses(e.data)
    } finally {
        setLoading(false)
    }
  }
    load()
  }, [])

  const formatDate = (dateString: string) => {
    return dateString ? format(new Date(dateString), 'yyyy-MM-dd') : ''
  }

  const setDateRange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setReportRequest(prev => ({
      ...prev,
      startDate: startDate ? startDate.toISOString() : "",
      endDate: endDate ? endDate.toISOString() : "",
    }))
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("username")
    localStorage.removeItem("userId")
    localStorage.removeItem("farmId")
    localStorage.removeItem("farmName")
    localStorage.removeItem("isStaff")
    localStorage.removeItem("isSubscriber")
    router.push("/login")
  }

  const reportTypes = [
    { value: "sales", label: "Sales Report" },
    { value: "expenses", label: "Expenses Report" },
    { value: "production", label: "Production Report" },
    { value: "feed-usage", label: "Feed Usage Report" },
    { value: "egg-production", label: "Egg Production Report" },
    { value: "flock-performance", label: "Flock Performance Report" },
    { value: "financial-summary", label: "Financial Summary" },
  ]

  // exports removed per requirements

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <DashboardSidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
                </div>
                <p className="text-slate-600">Comprehensive farm analytics and insights</p>
              </div>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                New Report
              </Button>
            </div>

            {/* Tabs + Filters toolbar */}
            <Card className="bg-white">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList>
                      <TabsTrigger value="production">Production</TabsTrigger>
                      <TabsTrigger value="financial">Financial</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input placeholder="Search by flock, medication, notes..." className="w-full sm:w-[240px]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Production content */}
            {tab === "production" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white"><CardContent className="py-4"><div className="text-xs text-slate-500">Total Eggs</div><div className="text-2xl font-bold">{records.reduce((s: number, r: any)=> s + (r.totalProduction||0), 0).toLocaleString()}</div></CardContent></Card>
                  <Card className="bg-white"><CardContent className="py-4"><div className="text-xs text-slate-500">Avg Daily Production</div><div className="text-2xl font-bold">{records.length? Math.round(records.reduce((s: number,r:any)=>s+(r.totalProduction||0),0)/records.length):0}</div></CardContent></Card>
                  <Card className="bg-white"><CardContent className="py-4"><div className="text-xs text-slate-500">Total Mortality</div><div className="text-2xl font-bold text-red-600">{records.reduce((s:number,r:any)=>s+(r.mortality||0),0).toLocaleString()}</div></CardContent></Card>
                      </div>
                <Card className="bg-white mt-4">
                  <CardHeader>
                    <CardTitle>Daily Egg Production</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{ total: { label: 'Total', color: 'hsl(142, 76%, 36%)' } }} className="h-[360px] aspect-auto">
                      <LineChart data={prodDaily}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card className="bg-white mt-4">
              <CardHeader>
                    <CardTitle>Egg Collection by Time of Day</CardTitle>
              </CardHeader>
              <CardContent>
                    <ChartContainer config={{ m9: { label: '9am', color: 'hsl(221, 83%, 53%)' }, m12: { label: '12pm', color: 'hsl(25, 95%, 53%)' }, m4: { label: '4pm', color: 'hsl(262, 83%, 58%)' } }} className="h-[360px] aspect-auto">
                      <BarChart data={prodByTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="m9" fill="var(--color-m9)" />
                        <Bar dataKey="m12" fill="var(--color-m12)" />
                        <Bar dataKey="m4" fill="var(--color-m4)" />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Financial content */}
            {tab === "financial" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white"><CardContent className="py-4"><div className="text-xs text-slate-500">Revenue</div><div className="text-2xl font-bold text-emerald-700">${sales.reduce((s:number,x:any)=>s+Number(x.totalAmount||0),0).toFixed(2)}</div></CardContent></Card>
                  <Card className="bg-white"><CardContent className="py-4"><div className="text-xs text-slate-500">Expenses</div><div className="text-2xl font-bold text-red-600">${expenses.reduce((s:number,x:any)=>s+Number(x.amount||0),0).toFixed(2)}</div></CardContent></Card>
                  <Card className="bg-white"><CardContent className="py-4"><div className="text-xs text-slate-500">Net Profit/Loss</div><div className="text-2xl font-bold">${(sales.reduce((s:number,x:any)=>s+Number(x.totalAmount||0),0)-expenses.reduce((s:number,x:any)=>s+Number(x.amount||0),0)).toFixed(2)}</div></CardContent></Card>
                  </div>
                <Card className="bg-white mt-4">
                  <CardHeader>
                    <CardTitle>Revenue vs Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{ revenue: { label: 'Revenue', color: 'hsl(142, 76%, 36%)' }, expenses: { label: 'Expenses', color: 'hsl(0, 84%, 60%)' } }} className="h-[360px] aspect-auto">
                      <LineChart data={revenueByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
              </CardContent>
            </Card>
              </>
            )}

            

            {/* Export sections removed */}
          </div>
        </main>
      </div>
    </div>
  )
}

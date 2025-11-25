"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Calendar as CalendarIcon, Download, Search, X, RefreshCw } from "lucide-react"
import { getProductionRecords, deleteProductionRecord, type ProductionRecord } from "@/lib/api/production-record"
import { getUserContext } from "@/lib/utils/user-context"
import { ProductionForm } from "@/components/production/production-form"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { exportReportToPDF, downloadBlob, getReportContext } from "@/lib/api/report"

export default function ProductionRecordsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<ProductionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filters
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedFlockId, setSelectedFlockId] = useState<string>("ALL")
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL")
  const [selectedYear, setSelectedYear] = useState<string>("ALL")

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductionRecord | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) {
      setError("User context not found. Please log in again.")
      setLoading(false)
      return
    }
    const res = await getProductionRecords(userId, farmId)
    if (res.success && res.data) setRecords(res.data)
    else setError(res.message || "Failed to load records")
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this production record?")) return
    const { userId, farmId } = getUserContext()
    const res = await deleteProductionRecord(id, userId, farmId)
    if (res.success) load()
    else setError(res.message || "Delete failed")
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/login")
  }

  // Distinct flocks derived from current records
  const distinctFlocks = useMemo(() => {
    const map = new Map<string, { name: string }>()
    records.forEach((r: any) => {
      if (r.flockId && r.flockName) map.set(String(r.flockId), { name: r.flockName })
    })
    return Array.from(map.entries()).map(([id, v]) => ({ id, name: v.name }))
  }, [records])

  // Distinct months/years
  const { distinctMonths, distinctYears } = useMemo(() => {
    const monthSet = new Set<string>()
    const yearSet = new Set<string>()
    records.forEach((r) => {
      const d = new Date(r.date)
      const year = `${d.getFullYear()}`
      const month = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthSet.add(month)
      yearSet.add(year)
    })
    return { distinctMonths: Array.from(monthSet).sort().reverse(), distinctYears: Array.from(yearSet).sort().reverse() }
  }, [records])

  // Apply filters
  const filtered = useMemo(() => {
    let list = records.slice()
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((r: any) => (
        r.flockName?.toLowerCase().includes(q) ||
        r.medication?.toLowerCase().includes(q) ||
        new Date(r.date).toLocaleDateString().toLowerCase().includes(q)
      ))
    }
    if (dateFrom) list = list.filter(r => new Date(r.date) >= dateFrom)
    if (dateTo) list = list.filter(r => new Date(r.date) <= dateTo)
    if (selectedFlockId !== "ALL") list = list.filter((r: any) => String(r.flockId) === selectedFlockId)
    if (selectedMonth !== "ALL") list = list.filter(r => {
      const d = new Date(r.date); const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; return m === selectedMonth
    })
    if (selectedYear !== "ALL") list = list.filter(r => new Date(r.date).getFullYear().toString() === selectedYear)
    return list
  }, [records, search, dateFrom, dateTo, selectedFlockId, selectedMonth, selectedYear])

  // Summaries
  const totalEggs = useMemo(() => filtered.reduce((s, r) => s + (Number(r.totalProduction) || 0), 0), [filtered])
  const totalFeed = useMemo(() => filtered.reduce((s, r) => s + (Number(r.feedKg) || 0), 0), [filtered])
  const totalDeaths = useMemo(() => filtered.reduce((s, r) => s + (Number(r.mortality) || 0), 0), [filtered])
  const total9AM = useMemo(() => filtered.reduce((s, r) => s + (Number(r.production9AM) || 0), 0), [filtered])
  const total12PM = useMemo(() => filtered.reduce((s, r) => s + (Number(r.production12PM) || 0), 0), [filtered])
  const total4PM = useMemo(() => filtered.reduce((s, r) => s + (Number(r.production4PM) || 0), 0), [filtered])
  const totalBirds = useMemo(() => filtered.reduce((s, r) => s + (Number(r.noOfBirds) || 0), 0), [filtered])
  const totalBirdsLeft = useMemo(() => filtered.reduce((s, r) => s + (Number(r.noOfBirdsLeft) || 0), 0), [filtered])
  const avgEggsPerRecord = useMemo(() => filtered.length ? Math.round(totalEggs / filtered.length) : 0, [filtered, totalEggs])
  const formatAge = (r: any) => {
    const daysRaw = Number(r.ageInDays ?? r.ageDays)
    const weeksRaw = Number(r.ageInWeeks ?? r.ageWeeks)
    const d = daysRaw || (weeksRaw ? weeksRaw * 7 : 0)
    if (!d) return "-"
    const y = Math.floor(d / 365)
    const w = Math.floor((d % 365) / 7)
    const dd = d % 7
    return `${y} yr ${w} wk ${dd} d (${d} days)`
  }

  const clearFilters = () => {
    setSearch("")
    setDateFrom(undefined)
    setDateTo(undefined)
    setSelectedFlockId("ALL")
    setSelectedMonth("ALL")
    setSelectedYear("ALL")
  }

  const exportCsv = () => {
    const headers = [
      "Date","FlockId","Age","9am","12pm","4pm","Total","EggPercent","FeedKg","Birds","Deaths","Left","Medication"
    ]
    const rows = filtered.map((r: any) => [
      new Date(r.date).toLocaleDateString(),
      r.flockId ?? "",
      formatAge(r),
      r.production9AM ?? 0,
      r.production12PM ?? 0,
      r.production4PM ?? 0,
      r.totalProduction ?? 0,
      (() => { const b = Number(r.noOfBirds)||0; const t = Number(r.totalProduction)||0; return b? ((t/b)*100).toFixed(1):"" })(),
      r.feedKg ?? 0,
      r.noOfBirds ?? 0,
      r.mortality ?? 0,
      r.noOfBirdsLeft ?? 0,
      r.medication || "",
    ])
    const csv = [headers, ...rows].map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `production-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = async () => {
    const { farmId, userId } = getReportContext()
    let start: Date | undefined = dateFrom
    let end: Date | undefined = dateTo
    if (!start || !end) {
      if (selectedMonth !== "ALL") {
        const [y, m] = selectedMonth.split('-').map(Number)
        start = start || new Date(y, (m || 1) - 1, 1)
        end = end || new Date(y, (m || 1), 0)
      } else if (selectedYear !== "ALL") {
        const y = Number(selectedYear)
        start = start || new Date(y, 0, 1)
        end = end || new Date(y, 11, 31)
      } else if (records.length > 0) {
        const dates = records.map(r => new Date(r.date))
        const minD = new Date(Math.min.apply(null, dates as any))
        const maxD = new Date(Math.max.apply(null, dates as any))
        start = start || minD
        end = end || maxD
      } else {
        const today = new Date()
        start = start || today
        end = end || today
      }
    }

    const payload: any = {
      farmId,
      userId,
      // Use ReportType expected by backend (EggProduction)
      reportType: "EggProduction",
      startDate: new Date(start!.getFullYear(), start!.getMonth(), start!.getDate()).toISOString(),
      endDate: new Date(end!.getFullYear(), end!.getMonth(), end!.getDate()).toISOString(),
    }
    if (selectedFlockId !== "ALL") payload.flockId = Number(selectedFlockId)

    const res = await exportReportToPDF(payload)
    if (res.success && res.data) {
      downloadBlob(res.data, `production-${new Date().toISOString().slice(0,10)}.pdf`)
    } else {
      alert(res.message || "Failed to export PDF")
    }
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <DashboardSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
              <div>
                  <h1 className="text-2xl font-bold text-slate-900">Egg Production</h1>
                  <p className="text-slate-600">Track daily egg production and performance metrics</p>
                </div>
              </div>
              <Button className="gap-2" onClick={() => { setEditing(null); setFormOpen(true) }}>
                <Plus className="w-4 h-4" /> Log Production
                </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border">
              <div className="relative w-full sm:w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal w-[140px]", !dateFrom && "text-muted-foreground") }>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM dd") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal w-[140px]", !dateTo && "text-muted-foreground") }>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM dd") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>

              <Select value={selectedFlockId} onValueChange={setSelectedFlockId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Flock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Flocks</SelectItem>
                  {distinctFlocks.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Months</SelectItem>
                  {distinctMonths.map((m) => {
                    const [y, mm] = m.split('-'); const d = new Date(parseInt(y), parseInt(mm) - 1)
                    return <SelectItem key={m} value={m}>{d.toLocaleDateString('en-US', { month: 'long' })}</SelectItem>
                  })}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {distinctYears.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Reset
                </Button>
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
                <Button size="sm" onClick={exportPdf}>
                  <Download className="h-4 w-4 mr-2" /> Export PDF
                </Button>
              </div>
            </div>

            {/* Metrics */}
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
                <div className="p-3 bg-white rounded border"><div className="text-xs text-slate-500">Total Eggs</div><div className="text-xl font-bold text-emerald-600">{totalEggs.toLocaleString()}</div></div>
                <div className="p-3 bg-white rounded border"><div className="text-xs text-slate-500">Average per Record</div><div className="text-xl font-bold">{avgEggsPerRecord.toLocaleString()}</div></div>
                <div className="p-3 bg-white rounded border"><div className="text-xs text-slate-500">Total Feed (kg)</div><div className="text-xl font-bold">{totalFeed.toFixed(2)}</div></div>
                <div className="p-3 bg-white rounded border"><div className="text-xs text-slate-500">Total Deaths</div><div className="text-xl font-bold text-red-600">{totalDeaths.toLocaleString()}</div></div>
                <div className="p-3 bg-white rounded border"><div className="text-xs text-slate-500">Total Birds</div><div className="text-xl font-bold text-slate-900">{totalBirds.toLocaleString()}</div></div>
                <div className="p-3 bg-white rounded border"><div className="text-xs text-slate-500">Birds Left</div><div className="text-xl font-bold text-emerald-700">{totalBirdsLeft.toLocaleString()}</div></div>
              </div>
            )}

            {/* Table */}
            {loading ? (
              <Card className="bg-white"><CardContent className="py-6">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 w-full bg-slate-100 animate-pulse rounded" />
                  ))}
                </div>
              </CardContent></Card>
            ) : (
              <Card className="bg-white">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-blue-50 z-10">
                        <TableRow className="border-b border-blue-200">
                          <TableHead className="min-w-[110px] px-3 py-2">Date</TableHead>
                          <TableHead className="min-w-[110px] px-3 py-2">Flock</TableHead>
                          <TableHead className="min-w-[170px] px-3 py-2">Age</TableHead>
                          <TableHead className="text-right min-w-[80px] px-3 py-2 bg-blue-100 text-blue-900 font-semibold">9am</TableHead>
                          <TableHead className="text-right min-w-[80px] px-3 py-2 bg-orange-100 text-orange-900 font-semibold">12pm</TableHead>
                          <TableHead className="text-right min-w-[80px] px-3 py-2 bg-purple-100 text-purple-900 font-semibold">4pm</TableHead>
                          <TableHead className="text-right min-w-[80px] px-3 py-2">Total</TableHead>
                          <TableHead className="text-right min-w-[80px] px-3 py-2">Egg%</TableHead>
                          <TableHead className="text-right min-w-[80px] px-3 py-2">Feed</TableHead>
                          <TableHead className="text-right min-w-[80px] px-3 py-2">Birds</TableHead>
                          <TableHead className="text-right min-w-[80px] px-3 py-2">Deaths</TableHead>
                          <TableHead className="text-right min-w-[80px] px-3 py-2">Left</TableHead>
                          <TableHead className="min-w-[110px] px-3 py-2">Meds</TableHead>
                          <TableHead className="text-right min-w-[90px] px-3 py-2">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={14} className="py-12 text-center text-slate-500">
                              No records found for the selected filters.
                              <Button variant="link" className="ml-1" onClick={() => { setEditing(null); setFormOpen(true) }}>Log one now</Button>
                            </TableCell>
                          </TableRow>
                        ) : filtered.map((r: any) => (
                          <TableRow key={r.id} className="hover:bg-slate-50/60">
                            <TableCell className="px-3 py-2">{new Date(r.date).toLocaleDateString()}</TableCell>
                            <TableCell className="px-3 py-2">{r.flockId != null ? `#${r.flockId}` : "-"}</TableCell>
                            <TableCell className="px-3 py-2">{formatAge(r)}</TableCell>
                            <TableCell className="text-right px-3 py-2 text-blue-700 bg-blue-50/40 rounded-sm">{r.production9AM ?? 0}</TableCell>
                            <TableCell className="text-right px-3 py-2 text-orange-700 bg-orange-50/40 rounded-sm">{r.production12PM ?? 0}</TableCell>
                            <TableCell className="text-right px-3 py-2 text-purple-700 bg-purple-50/40 rounded-sm">{r.production4PM ?? 0}</TableCell>
                            <TableCell className="text-right px-3 py-2 font-semibold text-slate-900">{r.totalProduction ?? 0}</TableCell>
                            <TableCell className="text-right px-3 py-2">{(() => { const b = Number(r.noOfBirds)||0; const t = Number(r.totalProduction)||0; return b? ((t/b)*100).toFixed(1)+"%":"-" })()}</TableCell>
                            <TableCell className="text-right px-3 py-2">{(r.feedKg ?? 0).toFixed ? r.feedKg.toFixed(2) : r.feedKg}</TableCell>
                            <TableCell className="text-right px-3 py-2">{r.noOfBirds ?? 0}</TableCell>
                            <TableCell className="text-right px-3 py-2">
                              <span className={cn("px-2 py-0.5 rounded text-xs", (r.mortality ?? 0) > 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600")}>{r.mortality ?? 0}</span>
                            </TableCell>
                            <TableCell className="text-right px-3 py-2">{r.noOfBirdsLeft ?? 0}</TableCell>
                            <TableCell className="px-3 py-2">{r.medication || "-"}</TableCell>
                            <TableCell className="text-right px-3 py-2">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setFormOpen(true) }}>Edit</Button>
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(r.id)}>Delete</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filtered.length > 0 && (
                          <TableRow className="bg-slate-50/60">
                            <TableCell className="font-semibold text-xs px-3 py-2">Totals</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-semibold px-3 py-2 text-blue-800 bg-blue-50 border border-blue-100 rounded">{total9AM.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold px-3 py-2 text-orange-800 bg-orange-50 border border-orange-100 rounded">{total12PM.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold px-3 py-2 text-purple-800 bg-purple-50 border border-purple-100 rounded">{total4PM.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold px-3 py-2 text-emerald-700">{totalEggs.toLocaleString()}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-semibold px-3 py-2">{totalFeed.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold px-3 py-2 text-slate-700">{totalBirds.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold px-3 py-2 text-red-700">{totalDeaths.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold px-3 py-2 text-emerald-700">{totalBirdsLeft.toLocaleString()}</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary footer to mirror client */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-3">
                <div className="p-2 bg-muted/30 rounded border"><div className="text-xs">Average Egg %:</div><div className="text-lg font-bold text-emerald-700">{(() => { const percents = filtered.map((r: any)=>{const b=Number(r.noOfBirds)||0;const t=Number(r.totalProduction)||0;return b? (t/b)*100:null}).filter(Boolean) as number[]; const v = percents.length? percents.reduce((a,b)=>a+b,0)/percents.length:0; return v.toFixed(1)+'%'; })()}</div></div>
                <div className="p-2 bg-muted/30 rounded border"><div className="text-xs">Avg Total Eggs:</div><div className="text-lg font-bold">{avgEggsPerRecord}</div></div>
                <div className="p-2 bg-muted/30 rounded border"><div className="text-xs">Total Deaths:</div><div className="text-lg font-bold text-red-600">{totalDeaths.toLocaleString()}</div></div>
                <div className="p-2 bg-muted/30 rounded border"><div className="text-xs">Total Eggs:</div><div className="text-lg font-bold">{totalEggs.toLocaleString()}</div></div>
                <div className="p-2 bg-muted/30 rounded border"><div className="text-xs">Total Crates:</div><div className="text-lg font-bold">{Math.floor(totalEggs/30).toLocaleString()}</div></div>
              </div>
            )}

          </div>
        </main>
      </div>

      <ProductionForm open={formOpen} onOpenChange={setFormOpen} record={editing} onSaved={load} />
    </div>
  )
}
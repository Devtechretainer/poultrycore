"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Plus, Pencil, Trash2, Calendar, DollarSign, Search, FileText as FileTextIcon, Download, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { getExpenses, deleteExpense, type Expense } from "@/lib/api/expense"
import { getUserContext } from "@/lib/utils/user-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency as fmtCurrency } from "@/lib/utils/currency"

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: number; farmId?: string; description?: string } | null>(null)
  const [selectedFlock, setSelectedFlock] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    loadExpenses()
    
    // Check for global search query from header
    if (typeof window !== 'undefined') {
      const globalSearch = sessionStorage.getItem('globalSearchQuery')
      if (globalSearch) {
        setSearchQuery(globalSearch)
        sessionStorage.removeItem('globalSearchQuery')
      }
      
      // Listen for global search events from header
      const handleGlobalSearch = (e: CustomEvent) => {
        setSearchQuery(e.detail.query)
      }
      
      window.addEventListener('globalSearch', handleGlobalSearch as EventListener)
      return () => {
        window.removeEventListener('globalSearch', handleGlobalSearch as EventListener)
      }
    }
  }, [])

  const loadExpenses = async () => {
    const { userId, farmId } = getUserContext()

    console.log("[v0] Loading expenses for userId:", userId, "farmId:", farmId)

    if (!userId || !farmId) {
      setError("User context not found. Please log in again.")
      setLoading(false)
      return
    }

    const result = await getExpenses(userId, farmId)

    console.log("[v0] Expenses loaded - success:", result.success, "data count:", result.data?.length)

    if (result.success && result.data) {
      console.log("[v0] First expense sample:", result.data[0])
      setExpenses(result.data)
    } else {
      console.error("[v0] Failed to load expenses:", result.message)
      setError(result.message ?? "Failed to load expenses")
    }

    setLoading(false)
  }

  const handleDelete = async (id: number, recordFarmId?: string) => {
    const { userId, farmId } = getUserContext()
    const effectiveFarmId = recordFarmId || farmId
    const result = await deleteExpense(id, userId, effectiveFarmId)

    if (result.success) {
      toast({ title: "Expense deleted", description: `Record #${id} has been removed.` })
      loadExpenses()
    } else {
      const msg = result.message ?? "Failed to delete expense"
      setError(msg)
      toast({ title: "Delete failed", description: msg })
    }
  }

  const openConfirmDelete = (id: number | string, farmId?: string, description?: string) => {
    const numericId = typeof id === 'string' ? Number(id) : id
    setPendingDelete({ id: Number.isFinite(numericId) ? (numericId as number) : 0, farmId, description })
    setConfirmOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    })
  }

  // Use global currency setting (default GHS)
  const formatCurrency = (amount: number) => fmtCurrency(amount)

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Feed': 'bg-green-100 text-green-800',
      'Veterinary': 'bg-red-100 text-red-800',
      'Equipment': 'bg-blue-100 text-blue-800',
      'Labor': 'bg-yellow-100 text-yellow-800',
      'Utilities': 'bg-purple-100 text-purple-800',
      'Other': 'bg-gray-100 text-gray-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
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

  // Filter expenses based on search and date range
  const filteredExpenses = expenses.filter(expense => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = q === "" || (() => {
      const flockStr = String(expense.flockId ?? "")
      const expIdStr = String((expense as any).expenseId ?? (expense as any).ExpenseId ?? (expense as any).id ?? (expense as any).Id ?? "")
      const paidTo = ((expense as any).paidTo ?? (expense as any).PaidTo ?? (expense as any).supplier ?? (expense as any).Supplier ?? "").toString().toLowerCase()
      const cat = (expense.category || "").toLowerCase()
      const pay = (expense.paymentMethod || "").toLowerCase()
      const desc = (expense.description || "").toLowerCase()
      // allow queries like "flock 3012" or just "3012"
      const qNum = Number(q.replace(/[^0-9]/g, ''))
      const hitsNumeric = Number.isFinite(qNum) && qNum > 0 && (flockStr === String(qNum) || expIdStr === String(qNum))
      return desc.includes(q) || cat.includes(q) || pay.includes(q) || paidTo.includes(q) || flockStr.includes(q) || expIdStr.includes(q) || hitsNumeric
    })()
    const matchesFromDate = fromDate === "" || new Date(expense.expenseDate) >= new Date(fromDate)
    const matchesToDate = toDate === "" || new Date(expense.expenseDate) <= new Date(toDate)
    const d = new Date(expense.expenseDate)
    const flockOk = selectedFlock === "all" || String(expense.flockId || "") === selectedFlock
    const monthOk = selectedMonth === "all" || (d.getMonth() + 1) === Number(selectedMonth)
    const catOk = selectedCategory === "all" || (expense.category || "").toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesFromDate && matchesToDate && flockOk && monthOk && catOk
  })

  // Calculate summary statistics
  const thisMonthTotal = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.expenseDate)
      const now = new Date()
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ExpenseId',
      'ExpenseDate',
      'Category',
      'Description',
      'Amount',
      'PaymentMethod',
      'PaidTo',
      'FlockId',
    ]
    const rows = filteredExpenses.map((e: any) => [
      e.expenseId ?? e.ExpenseId ?? e.id ?? e.Id ?? '',
      new Date(e.expenseDate).toISOString().split('T')[0],
      e.category,
      (e.description || '').replace(/\n|\r/g, ' '),
      e.amount,
      e.paymentMethod,
      e.paidTo ?? e.PaidTo ?? e.supplier ?? e.Supplier ?? '',
      e.flockId ?? '',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map((cell) => {
      const s = String(cell ?? '')
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }).join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export PDF (print-friendly window; user can Save as PDF)
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (!printWindow) return
    const styles = `
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
      h1 { font-size: 18px; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
      th { background: #f8fafc; text-align: left; }
      tfoot td { font-weight: 600; }
    `
    const rowsHtml = filteredExpenses.map((e: any) => `
      <tr>
        <td>${(e.expenseId ?? e.ExpenseId ?? e.id ?? e.Id ?? '')}</td>
        <td>${new Date(e.expenseDate).toLocaleDateString()}</td>
        <td>${e.category ?? ''}</td>
        <td>${(e.description ?? '').toString().replace(/</g, '&lt;')}</td>
        <td style="text-align:right;">${(e.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${e.paymentMethod ?? ''}</td>
      </tr>
    `).join('')
    const html = `<!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Expenses</title><style>${styles}</style></head>
        <body>
          <h1>Expenses Report</h1>
          <table>
            <thead>
              <tr>
                <th>ExpenseId</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th style="text-align:right;">Amount</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="4">Total (Filtered)</td>
                <td style="text-align:right;">${filteredTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <script>window.onload = function(){ window.print(); setTimeout(() => window.close(), 300); };</script>
        </body>
      </html>`
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <DashboardSidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading expenses...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <DashboardSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
                </div>
                <p className="text-slate-600">Track operational costs and financial records</p>
              </div>
              <Link href="/expenses/new">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add Expense
                </Button>
              </Link>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border">
              <div className="relative w-full sm:w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>

              <div className="relative w-full sm:w-[140px]">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  placeholder="From"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="relative w-full sm:w-[140px]">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  placeholder="To"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={selectedFlock} onValueChange={setSelectedFlock}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Flock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flocks</SelectItem>
                  {Array.from(new Set(expenses.map(e => String(e.flockId || ""))))
                    .filter(v => v && v !== "null" && v !== "undefined" && v !== "0")
                    .map(v => (
                      <SelectItem key={v} value={v}>Flock {v}</SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Category</SelectItem>
                  {Array.from(new Set(expenses.map(e => e.category))).filter(Boolean).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleExportPDF}>
                  <FileTextIcon className="w-4 h-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleExportCSV}>
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardDescription>This Month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(thisMonthTotal)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardDescription>Total (Filtered)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(filteredTotal)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expenses Table */}
            {filteredExpenses.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No expenses found</h3>
                  <p className="text-slate-600 mb-6">
                    {searchQuery || fromDate || toDate 
                      ? "No expenses match your search criteria."
                      : "Start tracking your farm expenses by adding your first expense record."
                    }
                  </p>
                  <Link href="/expenses/new">
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      Add First Expense
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>Manage your farm expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">
                          <div className="flex items-center gap-2">
                            Date
                            <ArrowUpDown className="w-4 h-4 text-slate-400" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Description
                            <ArrowUpDown className="w-4 h-4 text-slate-400" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Category
                            <ArrowUpDown className="w-4 h-4 text-slate-400" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            Amount
                            <ArrowUpDown className="w-4 h-4 text-slate-400" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Payment Method
                            <ArrowUpDown className="w-4 h-4 text-slate-400" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Paid To
                            <ArrowUpDown className="w-4 h-4 text-slate-400" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense, idx) => (
                        <TableRow key={`${expense.expenseId || 'tmp'}-${idx}`}>
                          <TableCell className="font-medium">
                            {formatDate(expense.expenseDate)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{expense.description}</div>
                              {expense.notes && (
                                <div className="text-sm text-slate-500">{expense.notes}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(expense.category)}>
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.paymentMethod || "N/A"}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {expense.paidTo || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {(() => { const eid = (expense as any).expenseId ?? (expense as any).ExpenseId ?? (expense as any).id ?? (expense as any).Id; const idNum = Number(eid); const validId = Number.isFinite(idNum) && idNum > 0; const fId = expense.farmId ?? (expense as any).FarmId ?? ""; return (
                              <Link href={validId ? `/expenses/${idNum}?farmId=${encodeURIComponent(fId)}` : "#"}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!validId} title={!validId ? "Invalid expense id" : undefined}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </Link>
                              ) })()}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openConfirmDelete((expense as any).expenseId ?? (expense as any).ExpenseId ?? (expense as any).id ?? (expense as any).Id, expense.farmId, expense.description)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      {/* Delete confirmation dialog */}
      <ExpensesConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          if (pendingDelete) {
            setConfirmOpen(false)
            handleDelete(pendingDelete.id, pendingDelete.farmId)
          }
        }}
        description={pendingDelete?.description}
      />
    </div>
  )
}

// Confirm dialog mounted at end to keep JSX tidy
export function ExpensesConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  description,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
  description?: string
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete expense?</AlertDialogTitle>
          <AlertDialogDescription>
            {description ? (
              <>This will permanently remove "{description}".</>
            ) : (
              <>This action cannot be undone.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

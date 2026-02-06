"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Egg, Search, RefreshCw } from "lucide-react"
import { getEggProductions, deleteEggProduction, type EggProduction } from "@/lib/api/egg-production"
import { getFlockBatches, type FlockBatch } from "@/lib/api/flock-batch"
import { getUserContext } from "@/lib/utils/user-context"
import { usePermissions } from "@/hooks/use-permissions"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"

export default function EggProductionsPage() {
  const router = useRouter()
  const permissions = usePermissions()
  const [eggProductions, setEggProductions] = useState<EggProduction[]>([])
  const [flockBatches, setFlockBatches] = useState<FlockBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Filter states
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedFlock, setSelectedFlock] = useState<string>("ALL")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { farmId, userId } = getUserContext()
    
    if (!farmId || !userId) {
      setError("Farm ID or User ID not found")
      setLoading(false)
      return
    }

    const [eggProductionsResult, flockBatchesResult] = await Promise.all([
      getEggProductions(userId, farmId),
      getFlockBatches(userId, farmId)
    ]);
    
    if (eggProductionsResult.success && eggProductionsResult.data) {
      setEggProductions(eggProductionsResult.data)
    } else {
      setError(eggProductionsResult.message || "Failed to load egg productions")
    }

    if (flockBatchesResult.success && flockBatchesResult.data) {
      setFlockBatches(flockBatchesResult.data)
    }
    
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this egg production record? This action cannot be undone.")) {
      return
    }

    const { farmId, userId } = getUserContext()
    if (!farmId || !userId) return

    const result = await deleteEggProduction(id, userId, farmId)
    
    if (result.success) {
      loadData()
      setCurrentPage(1)
    } else {
      setError(result.message)
    }
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

  const clearFilters = () => {
    setSearch("")
    setDateFrom(undefined)
    setDateTo(undefined)
    setSelectedFlock("ALL")
  }

  const getFlockName = (prod: EggProduction) => {
    // Use flockName from API response if available, otherwise fallback to lookup
    if (prod.flockName) return prod.flockName
    return flockBatches.find(fb => fb.batchId === prod.flockId)?.batchName || "Unknown Flock"
  }

  const filteredEggProductions = useMemo(() => {
    let currentList = eggProductions

    if (search) {
      const query = search.toLowerCase()
      currentList = currentList.filter(prod => 
        getFlockName(prod).toLowerCase().includes(query) ||
        (prod.notes ?? '').toLowerCase().includes(query)
      )
    }

    if (dateFrom) {
      currentList = currentList.filter(prod => new Date(prod.productionDate) >= dateFrom)
    }
    if (dateTo) {
      currentList = currentList.filter(prod => new Date(prod.productionDate) <= dateTo)
    }
    if (selectedFlock !== "ALL") {
      currentList = currentList.filter(prod => prod.flockId === parseInt(selectedFlock))
    }

    return currentList
  }, [eggProductions, search, dateFrom, dateTo, selectedFlock])

  const totalEggs = useMemo(() => filteredEggProductions.reduce((sum, p) => sum + p.totalProduction, 0), [filteredEggProductions]);
  const totalBroken = useMemo(() => filteredEggProductions.reduce((sum, p) => sum + (p.brokenEggs ?? 0), 0), [filteredEggProductions]);
  const avgProduction = useMemo(() => filteredEggProductions.length ? totalEggs / filteredEggProductions.length : 0, [totalEggs, filteredEggProductions.length]);


  // Pagination logic
  const totalPages = Math.ceil(filteredEggProductions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEggProductions = filteredEggProductions.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    
    return pages
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
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Egg className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Egg Production</h1>
                </div>
                <p className="text-slate-600">Manage your egg production records</p>
              </div>
              <Link href="/egg-production/new" prefetch={true}>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add Production Record
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border">
              <div className="relative w-full sm:w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search by flock or notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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

              <Select value={selectedFlock} onValueChange={setSelectedFlock}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Flock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Flocks</SelectItem>
                  {flockBatches.map(flock => (
                    <SelectItem key={flock.batchId} value={flock.batchId.toString()}>{flock.batchName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Reset
                </Button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Metrics */}
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded border"><div className="text-xs text-slate-500">Total Eggs</div><div className="text-xl font-bold text-emerald-600">{totalEggs.toLocaleString()}</div></div>
                <div className="p-3 bg-white rounded border"><div className="text-xs text-slate-500">Total Broken</div><div className="text-xl font-bold text-red-600">{totalBroken.toLocaleString()}</div></div>
                <div className="p-3 bg-white rounded border"><div className="text-xs text-slate-500">Average Production</div><div className="text-xl font-bold">{avgProduction.toFixed(2)}</div></div>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-600">Loading egg production records...</p>
                </CardContent>
              </Card>
            ) : filteredEggProductions.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Egg className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No production records found</h3>
                  <p className="text-slate-600 mb-6">Get started by creating your first egg production record.</p>
                  <Link href="/egg-production/new" prefetch={true}>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      Add Production Record
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b">
                          <TableHead className="font-semibold text-slate-900 min-w-[150px]">Production Date</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[150px]">Flock</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[120px] hidden sm:table-cell">Total Production</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[120px] hidden md:table-cell">Broken Eggs</TableHead>
                          <TableHead className="font-semibold text-slate-900 text-center min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentEggProductions.map((prod) => (
                          <TableRow key={prod.productionId} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-medium text-slate-900">
                              {new Date(prod.productionDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getFlockName(prod)}</TableCell>
                            <TableCell className="hidden sm:table-cell">{prod.totalProduction}</TableCell>
                            <TableCell className="hidden md:table-cell">{prod.brokenEggs}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Link href={`/egg-production/${prod.productionId}`} prefetch={true}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </Link>
                                {permissions.canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(prod.productionId)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                         <TableRow className="bg-slate-50 font-semibold">
                            <TableCell colSpan={2} className="text-right">Total</TableCell>
                            <TableCell className="hidden sm:table-cell">{totalEggs}</TableCell>
                            <TableCell className="hidden md:table-cell">{totalBroken}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Pagination */}
            {!loading && filteredEggProductions.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredEggProductions.length)} of {filteredEggProductions.length} records
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={handlePreviousPage}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(page as number)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={handleNextPage}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
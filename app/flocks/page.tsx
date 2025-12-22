"use client"

import { useEffect, useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Plus, Pencil, Trash2, Calendar, Bird, Users, MapPin, AlertCircle, Search, X, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react"
import { useIsMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { getFlocks, deleteFlock, type Flock } from "@/lib/api/flock"
import { getHouses, type House } from "@/lib/api/house"
import { getFlockBatches, type FlockBatch } from "@/lib/api/flock-batch"
import { getUserContext } from "@/lib/utils/user-context"
import { usePermissions } from "@/hooks/use-permissions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMemo } from "react"

export default function FlocksPage() {
  const router = useRouter()
  const permissions = usePermissions()
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Filter states
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL") // "ALL", "active", "inactive"
  const [selectedHouseId, setSelectedHouseId] = useState<string>("ALL")
  const [selectedBatchId, setSelectedBatchId] = useState<string>("ALL")
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [quantityMin, setQuantityMin] = useState<string>("")
  const [quantityMax, setQuantityMax] = useState<string>("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const isMobile = useIsMobile()
  
  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Data for filter dropdowns
  const [houses, setHouses] = useState<House[]>([])
  const [flockBatches, setFlockBatches] = useState<FlockBatch[]>([])

  useEffect(() => {
    loadFlocks()
    loadFilterData()
  }, [])

  const loadFilterData = async () => {
    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) return

    const [housesRes, flockBatchesRes] = await Promise.all([
      getHouses(userId, farmId),
      getFlockBatches(userId, farmId),
    ])

    if (housesRes.success && housesRes.data) setHouses(housesRes.data as House[])
    if (flockBatchesRes.success && flockBatchesRes.data) setFlockBatches(flockBatchesRes.data as FlockBatch[])
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedStatus("ALL")
    setSelectedHouseId("ALL")
    setSelectedBatchId("ALL")
    setDateFrom(undefined)
    setDateTo(undefined)
    setQuantityMin("")
    setQuantityMax("")
  }
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const loadFlocks = async () => {
    const { farmId, userId } = getUserContext()
    
    if (!farmId || !userId) {
      setError("Farm ID or User ID not found")
      setLoading(false)
      return
    }

    const result = await getFlocks(userId, farmId)
    
    if (result.success && result.data) {
      setFlocks(result.data)
      setCurrentPage(1)
    } else {
      setError(result.message || "Failed to load flocks")
    }
    
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this flock? This action cannot be undone.")) {
      return
    }

    const { farmId, userId } = getUserContext()
    if (!farmId || !userId) return

    console.log("Deleting flock with id:", id, "userId:", userId, "farmId:", farmId)

    const result = await deleteFlock(id, userId, farmId)
    
    if (result.success) {
      // Refresh the list
      loadFlocks()
      setCurrentPage(1)
    } else {
      setError(result.message || "Failed to delete flock")
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

  const handleQuantityMinChange = (value: string) => {
    setQuantityMin(value || "")
  }

  const handleQuantityMaxChange = (value: string) => {
    setQuantityMax(value || "")
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

  const filteredFlocks = useMemo(() => {
    let currentList = flocks

    if (search) {
      const query = search.toLowerCase()
      currentList = currentList.filter(flock => 
        (flock.name ?? '').toLowerCase().includes(query) ||
        (flock.breed ?? '').toLowerCase().includes(query) ||
        flock.notes?.toLowerCase().includes(query)
      )
    }

    if (selectedStatus !== "ALL") {
      const isActive = selectedStatus === "active"
      currentList = currentList.filter(flock => flock.active === isActive)
    }

    if (selectedHouseId !== "ALL") {
      currentList = currentList.filter(flock => String(flock.houseId) === selectedHouseId)
    }

    if (selectedBatchId !== "ALL") {
      currentList = currentList.filter(flock => String(flock.batchId) === selectedBatchId)
    }

    if (dateFrom) {
      currentList = currentList.filter(flock => new Date(flock.startDate) >= dateFrom)
    }

    if (dateTo) {
      currentList = currentList.filter(flock => new Date(flock.startDate) <= dateTo)
    }

    if (quantityMin) {
      const min = parseInt(quantityMin)
      if (!isNaN(min)) {
        currentList = currentList.filter(flock => flock.quantity >= min)
      }
    }

    if (quantityMax) {
      const max = parseInt(quantityMax)
      if (!isNaN(max)) {
        currentList = currentList.filter(flock => flock.quantity <= max)
      }
    }

    // Apply sorting
    if (sortField) {
      currentList = [...currentList].sort((a, b) => {
        let aVal: any
        let bVal: any
        
        switch (sortField) {
          case "name":
            aVal = a.name ?? ""
            bVal = b.name ?? ""
            break
          case "quantity":
            aVal = a.quantity ?? 0
            bVal = b.quantity ?? 0
            break
          case "startDate":
            aVal = new Date(a.startDate).getTime()
            bVal = new Date(b.startDate).getTime()
            break
          case "breed":
            aVal = a.breed ?? ""
            bVal = b.breed ?? ""
            break
          default:
            return 0
        }
        
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return currentList
  }, [flocks, search, selectedStatus, selectedHouseId, selectedBatchId, dateFrom, dateTo, quantityMin, quantityMax, sortField, sortDirection])

  // Pagination logic
  const totalPages = Math.ceil(filteredFlocks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedFlocks = filteredFlocks.slice(startIndex, endIndex)

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return 'N/A'
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...'
    }
    return text
  }

  const calculateAge = (startDate: string) => {
    const start = new Date(startDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - start.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(diffDays / 7)
    const days = diffDays % 7
    return { days: diffDays, weeks, remainingDays: days }
  }

  const formatAge = (startDate: string) => {
    const { days, weeks, remainingDays } = calculateAge(startDate)
    return `${weeks} weeks ${remainingDays} days (${days} days)`
  }

  const totalBirdsLeft = useMemo(() => {
    return filteredFlocks.reduce((sum, flock) => sum + (flock.quantity || 0), 0)
  }, [filteredFlocks])

  return (
    <div className="flex h-screen bg-slate-100">
      <DashboardSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Bird className="w-5 h-5 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Flocks</h1>
                </div>
                <p className="text-slate-600">Manage your bird flocks</p>
              </div>
              <Link href="/flocks/new" prefetch={true}>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add Flock
                </Button>
              </Link>
            </div>

            {/* Filters: inline on desktop, sheet on mobile */}
            {isMobile ? (
              <>
                <div className="flex w-full items-center gap-2 p-2">
                  <div className="flex-1" />
                  <Button variant="outline" onClick={() => setFiltersOpen(true)} className="ml-auto">
                    <Filter className="mr-2 h-4 w-4" /> Filters
                  </Button>
                </div>

                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="p-4 space-y-3">
                      {/* reuse the same filter controls inside the sheet */}
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search by name, breed, or notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                      </div>

                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={selectedHouseId} onValueChange={setSelectedHouseId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="House" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Houses</SelectItem>
                          {houses.map(h => (
                            <SelectItem key={h.houseId} value={String(h.houseId)}>{(h as any).houseName || (h as any).name || `House ${h.houseId}`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Batch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Batches</SelectItem>
                          {flockBatches.map(b => (
                            <SelectItem key={b.batchId} value={String(b.batchId)}>{b.batchName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("justify-start text-left font-normal w-full", !dateFrom && "text-muted-foreground")}>
                              <Calendar className="mr-2 h-4 w-4" />
                              {dateFrom ? format(dateFrom, "MMM dd") : "From Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                          </PopoverContent>
                        </Popover>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("justify-start text-left font-normal w-full", !dateTo && "text-muted-foreground")}>
                              <Calendar className="mr-2 h-4 w-4" />
                              {dateTo ? format(dateTo, "MMM dd") : "To Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min Quantity"
                          value={quantityMin}
                          onChange={(e) => handleQuantityMinChange(e.target.value)}
                          className="flex-1"
                        />

                        <Input
                          type="number"
                          placeholder="Max Quantity"
                          value={quantityMax}
                          onChange={(e) => handleQuantityMaxChange(e.target.value)}
                          className="flex-1"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          <RefreshCw className="h-4 w-4 mr-2" /> Reset
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border">
                <div className="relative w-full sm:w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search by name, breed, or notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedHouseId} onValueChange={setSelectedHouseId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="House" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Houses</SelectItem>
                    {houses.map(h => (
                      <SelectItem key={h.houseId} value={String(h.houseId)}>{(h as any).houseName || (h as any).name || `House ${h.houseId}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Batches</SelectItem>
                    {flockBatches.map(b => (
                      <SelectItem key={b.batchId} value={String(b.batchId)}>{b.batchName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal w-[140px]", !dateFrom && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM dd") : "From Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal w-[140px]", !dateTo && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM dd") : "To Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                  </PopoverContent>
                </Popover>

                <Input
                  type="number"
                  placeholder="Min Quantity"
                  value={quantityMin}
                  onChange={(e) => handleQuantityMinChange(e.target.value)}
                  className="w-[120px]"
                />

                <Input
                  type="number"
                  placeholder="Max Quantity"
                  value={quantityMax}
                  onChange={(e) => handleQuantityMaxChange(e.target.value)}
                  className="w-[120px]"
                />

                <div className="ml-auto">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Reset
                  </Button>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Content */}
            {loading ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-600">Loading flocks...</p>
                </CardContent>
              </Card>
            ) : filteredFlocks.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bird className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No flocks found</h3>
                  <p className="text-slate-600 mb-6">Get started by creating your first flock.</p>
                  <Link href="/flocks/new" prefetch={true}>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      Add Flock
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
                          <TableHead 
                            className="font-semibold text-slate-900 min-w-[150px] cursor-pointer hover:bg-slate-50"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center gap-2">
                              Name
                              {sortField === "name" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[100px] hidden sm:table-cell">Status</TableHead>
                          <TableHead 
                            className="font-semibold text-slate-900 min-w-[120px] hidden md:table-cell cursor-pointer hover:bg-slate-50"
                            onClick={() => handleSort("quantity")}
                          >
                            <div className="flex items-center gap-2">
                              Quantity
                              {sortField === "quantity" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="font-semibold text-slate-900 min-w-[150px] hidden lg:table-cell cursor-pointer hover:bg-slate-50"
                            onClick={() => handleSort("breed")}
                          >
                            <div className="flex items-center gap-2">
                              Breed
                              {sortField === "breed" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[150px] hidden lg:table-cell">Batch</TableHead>
                          <TableHead 
                            className="font-semibold text-slate-900 min-w-[150px] hidden xl:table-cell cursor-pointer hover:bg-slate-50"
                            onClick={() => handleSort("startDate")}
                          >
                            <div className="flex items-center gap-2">
                              Start Date
                              {sortField === "startDate" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[150px] hidden xl:table-cell">Age</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[150px] hidden xl:table-cell">Reason for Inactivation</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[150px] hidden xl:table-cell">Notes</TableHead>
                          <TableHead className="font-semibold text-slate-900 text-center min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedFlocks.map((flock) => (
                          <TableRow key={flock.flockId} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-medium text-slate-900">
                              <div className="flex flex-col">
                                <span>{flock.name}</span>
                                <div className="flex items-center gap-2 text-xs text-slate-500 sm:hidden mt-1">
                                  <Badge 
                                    variant={flock.active ? "default" : "secondary"}
                                    className={flock.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                  >
                                    {flock.active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge 
                                      variant={flock.active ? "default" : "secondary"}
                                      className={flock.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                    >
                                      {flock.active ? "Active" : "Inactive"}
                                    </Badge>
                                  </TooltipTrigger>
                                  {!flock.active && (
                                    <TooltipContent>
                                      <p>{flock.inactivationReason}{flock.inactivationReason === 'other' && `: ${flock.otherReason}`}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span>{flock.quantity.toLocaleString()} birds</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <Bird className="w-4 h-4 text-slate-400" />
                                <span>{flock.breed}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span>{flock.batchName || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden xl:table-cell">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span>{new Date(flock.startDate).toLocaleDateString()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden xl:table-cell">
                              <span className="text-sm">{formatAge(flock.startDate)}</span>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden xl:table-cell">
                              <div className="flex items-center gap-2">
                                <span>{flock.inactivationReason || '-'}</span>
                                {flock.inactivationReason === 'other' && flock.otherReason && <span>({flock.otherReason})</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden xl:table-cell">
                              <span>{truncateText(flock.notes, 50)}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Link href={`/flocks/${flock.flockId}`} prefetch={true}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </Link>
                                {permissions.canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(flock.flockId)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Total Birds Left Summary */}
            {!loading && filteredFlocks.length > 0 && (
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-slate-600" />
                      <span className="text-lg font-semibold text-slate-900">Total Birds Left:</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700">{totalBirdsLeft.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Pagination */}
            {!loading && filteredFlocks.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredFlocks.length)} of {filteredFlocks.length} flocks
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

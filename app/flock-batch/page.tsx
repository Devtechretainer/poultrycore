"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
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
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Bird, Users, Search, RefreshCw, Eye } from "lucide-react"
import { getFlockBatches, deleteFlockBatch, type FlockBatch } from "@/lib/api/flock-batch"
import { getFlocks, type Flock } from "@/lib/api/flock"
import { getUserContext } from "@/lib/utils/user-context"
import { usePermissions } from "@/hooks/use-permissions"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function FlockBatchesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const permissions = usePermissions()
  const [flockBatches, setFlockBatches] = useState<FlockBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Filter states
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedBreed, setSelectedBreed] = useState<string>("ALL")
  
  // Dialog state for showing flocks
  const [flocksDialogOpen, setFlocksDialogOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<FlockBatch | null>(null)
  const [batchFlocks, setBatchFlocks] = useState<Flock[]>([])
  const [loadingFlocks, setLoadingFlocks] = useState(false)
  const lastPathnameRef = useRef<string | null>(null)

  // Initial load
  useEffect(() => {
    loadFlockBatches()
    lastPathnameRef.current = pathname
  }, [])

  // Refresh when navigating back to this page (e.g., after creating a batch)
  useEffect(() => {
    // Only refresh if pathname changed to /flock-batch (navigated back to this page)
    if (pathname === '/flock-batch' && lastPathnameRef.current !== pathname && lastPathnameRef.current !== null) {
      console.log("[FlockBatchesPage] Navigated back to /flock-batch, refreshing batches...")
      loadFlockBatches()
    }
    lastPathnameRef.current = pathname
  }, [pathname])

  const loadFlockBatches = async () => {
    const { farmId, userId } = getUserContext()
    
    if (!farmId || !userId) {
      setError("Farm ID or User ID not found")
      setLoading(false)
      return
    }

    const result = await getFlockBatches(userId, farmId)
    
    if (result.success && result.data) {
      setFlockBatches(result.data)
      setCurrentPage(1)
    } else {
      setError(result.message || "Failed to load flock batches")
    }
    
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this flock batch? This action cannot be undone.")) {
      return
    }

    const { farmId, userId } = getUserContext()
    if (!farmId || !userId) return

    console.log("Deleting flock batch with id:", id, "userId:", userId, "farmId:", farmId)

    const result = await deleteFlockBatch(id, userId, farmId)
    
    if (result.success) {
      // Refresh the list
      loadFlockBatches()
      setCurrentPage(1)
    } else {
      setError(result.message || "Failed to delete flock batch")
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
    setSelectedBreed("ALL")
  }

  const distinctBreeds = useMemo(() => {
    const breeds = new Set(flockBatches.map(batch => batch.breed).filter(Boolean))
    return Array.from(breeds)
  }, [flockBatches])

  const filteredFlockBatches = useMemo(() => {
    let currentList = flockBatches

    if (search) {
      const query = search.toLowerCase()
      currentList = currentList.filter(batch => 
        (batch.batchName ?? '').toLowerCase().includes(query) ||
        (batch.batchCode ?? '').toLowerCase().includes(query)
      )
    }

    if (dateFrom) {
      currentList = currentList.filter(batch => new Date(batch.startDate) >= dateFrom)
    }
    if (dateTo) {
      currentList = currentList.filter(batch => new Date(batch.startDate) <= dateTo)
    }
    if (selectedBreed !== "ALL") {
      currentList = currentList.filter(batch => batch.breed === selectedBreed)
    }

    return currentList
  }, [flockBatches, search, dateFrom, dateTo, selectedBreed])

  // Pagination logic
  const totalPages = Math.ceil(filteredFlockBatches.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentFlockBatches = filteredFlockBatches.slice(startIndex, endIndex)

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

  const handleViewFlocks = async (batch: FlockBatch) => {
    setSelectedBatch(batch)
    setFlocksDialogOpen(true)
    setLoadingFlocks(true)
    
    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) {
      setLoadingFlocks(false)
      return
    }

    const result = await getFlocks(userId, farmId)
    if (result.success && result.data) {
      // Filter flocks by batchId
      const flocksForBatch = result.data.filter(flock => flock.batchId === batch.batchId)
      setBatchFlocks(flocksForBatch)
    }
    
    setLoadingFlocks(false)
  }


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
                  <h1 className="text-2xl font-bold text-slate-900">Flock Batches</h1>
                </div>
                <p className="text-slate-600">Manage your bird flock batches</p>
              </div>
              <Link href="/flock-batch/new" prefetch={true}>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add Flock Batch
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border">
              <div className="relative w-full sm:w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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

              <Select value={selectedBreed} onValueChange={setSelectedBreed}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Breed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Breeds</SelectItem>
                  {distinctBreeds.map(breed => (
                    <SelectItem key={breed} value={breed}>{breed}</SelectItem>
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

            {/* Content */}
            {loading ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-600">Loading flock batches...</p>
                </CardContent>
              </Card>
            ) : filteredFlockBatches.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bird className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No flock batches found</h3>
                  <p className="text-slate-600 mb-6">Get started by creating your first flock batch.</p>
                  <Link href="/flock-batch/new" prefetch={true}>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      Add Flock Batch
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
                          <TableHead className="font-semibold text-slate-900 min-w-[150px]">Name</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[100px] hidden sm:table-cell">Code</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[120px] hidden md:table-cell">Number of Birds</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[150px] hidden lg:table-cell">Breed</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[150px] hidden xl:table-cell">Start Date</TableHead>
                          <TableHead className="font-semibold text-slate-900 text-center min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentFlockBatches.map((batch) => (
                          <TableRow 
                            key={batch.batchId} 
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => handleViewFlocks(batch)}
                          >
                            <TableCell className="font-medium text-slate-900">
                              {batch.batchName}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{batch.batchCode}</TableCell>
                            <TableCell className="text-slate-600 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span>{batch.numberOfBirds.toLocaleString()} birds</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <Bird className="w-4 h-4 text-slate-400" />
                                <span>{batch.breed}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden xl:table-cell">
                              <div className="flex items-center gap-2">
                                <span>{new Date(batch.startDate).toLocaleDateString()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Link href={`/flock-batch/${batch.batchId}`} prefetch={true}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </Link>
                                {permissions.canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(batch.batchId)}
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
            
            {/* Pagination */}
            {!loading && filteredFlockBatches.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredFlockBatches.length)} of {filteredFlockBatches.length} flock batches
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

      {/* Flocks Dialog */}
      <Dialog open={flocksDialogOpen} onOpenChange={setFlocksDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Flocks in Batch: {selectedBatch?.batchName}</DialogTitle>
            <DialogDescription>
              View all flocks created under this batch
            </DialogDescription>
          </DialogHeader>
          
          {loadingFlocks ? (
            <div className="py-8 text-center">
              <p className="text-slate-600">Loading flocks...</p>
            </div>
          ) : batchFlocks.length === 0 ? (
            <div className="py-8 text-center">
              <Bird className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No flocks found for this batch</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Breed</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchFlocks.map((flock) => (
                      <TableRow key={flock.flockId}>
                        <TableCell className="font-medium">{flock.name}</TableCell>
                        <TableCell>{flock.breed}</TableCell>
                        <TableCell>{flock.quantity.toLocaleString()} birds</TableCell>
                        <TableCell>{new Date(flock.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={flock.active ? "default" : "secondary"} className={flock.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {flock.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-slate-600">
                  Total Flocks: <span className="font-semibold">{batchFlocks.length}</span>
                </div>
                <div className="text-sm text-slate-600">
                  Total Birds: <span className="font-semibold">
                    {batchFlocks.reduce((sum, f) => sum + (f.quantity || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

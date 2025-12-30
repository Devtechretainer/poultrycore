"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Plus, Pencil, Trash2, Mail, Phone, MapPin, Users, Search, RefreshCw } from "lucide-react"
import Link from "next/link"
import { getCustomers, deleteCustomer, type Customer } from "@/lib/api/customer"
import { getUserContext } from "@/lib/utils/user-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePermissions } from "@/hooks/use-permissions"
import { Input } from "@/components/ui/input"
import { useMemo } from "react"

export default function CustomersPage() {
  const router = useRouter()
  const permissions = usePermissions()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadCustomers()
    
    // Check for global search query from header
    if (typeof window !== 'undefined') {
      const globalSearch = sessionStorage.getItem('globalSearchQuery')
      if (globalSearch) {
        setSearchQuery(globalSearch)
        sessionStorage.removeItem('globalSearchQuery') // Clear after using
      }
      
      // Listen for global search events from header
      const handleGlobalSearch = (e: CustomEvent) => {
        setSearchQuery(e.detail.query)
        setCurrentPage(1)
      }
      
      window.addEventListener('globalSearch', handleGlobalSearch as EventListener)
      return () => {
        window.removeEventListener('globalSearch', handleGlobalSearch as EventListener)
      }
    }
  }, [])

  const loadCustomers = async () => {
    const { userId, farmId } = getUserContext()

    if (!userId || !farmId) {
      setError("User context not found. Please log in again.")
      setLoading(false)
      return
    }

    const result = await getCustomers(userId, farmId)

    if (result.success && result.data) {
      setCustomers(result.data)
      setCurrentPage(1) // Reset to first page when data is loaded
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return

    const { userId, farmId } = getUserContext()
    const result = await deleteCustomer(id, userId, farmId)

    if (result.success) {
      loadCustomers()
      setCurrentPage(1) // Reset to first page after deletion
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
    localStorage.removeItem("roles")
    router.push("/login")
  }

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return customers
    }
    
    const query = searchQuery.toLowerCase()
    return customers.filter(customer => 
      (customer.name || '').toLowerCase().includes(query) ||
      (customer.contactEmail || '').toLowerCase().includes(query) ||
      (customer.contactPhone || '').toLowerCase().includes(query) ||
      (customer.city || '').toLowerCase().includes(query) ||
      (customer.address || '').toLowerCase().includes(query)
    )
  }, [customers, searchQuery])

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex)

  const clearFilters = () => {
    setSearchQuery("")
    setCurrentPage(1)
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

  // Generate page numbers for pagination
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
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <DashboardSidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
                </div>
                <p className="text-slate-600">Manage your customer database</p>
              </div>
              <Link href="/customers/new" prefetch={true}>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Button>
              </Link>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Search and Filter */}
            {!loading && customers.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search by name, email, phone, city, or address..." 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1) // Reset to first page when searching
                    }}
                    className="pl-9"
                  />
                </div>
                {searchQuery && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            {loading ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-600">Loading customers...</p>
                </CardContent>
              </Card>
            ) : filteredCustomers.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No customers found</h3>
                  <p className="text-slate-600 mb-6">
                    {searchQuery ? `No customers match "${searchQuery}"` : "Get started by adding your first customer"}
                  </p>
                  {!searchQuery && (
                    <Link href="/customers/new" prefetch={true}>
                      <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                        Add Your First Customer
                      </Button>
                    </Link>
                  )}
                  {searchQuery && (
                    <Button className="gap-2" variant="outline" onClick={clearFilters}>
                      <RefreshCw className="w-4 h-4" />
                      Clear Search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : customers.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No customers found</h3>
                  <p className="text-slate-600 mb-6">Get started by adding your first customer</p>
                  <Link href="/customers/new" prefetch={true}>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      Add Your First Customer
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
                          <TableHead className="font-semibold text-slate-900 min-w-[200px] hidden sm:table-cell">Email</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[150px] hidden md:table-cell">Phone</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[120px] hidden lg:table-cell">City</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[200px] hidden xl:table-cell">Address</TableHead>
                          <TableHead className="font-semibold text-slate-900 text-center min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentCustomers.map((customer) => (
                          <TableRow key={customer.customerId} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-medium text-slate-900">
                              <div className="flex flex-col">
                                <span>{customer.name}</span>
                                <div className="flex items-center gap-1 text-xs text-slate-500 sm:hidden">
                                  <MapPin className="w-3 h-3" />
                                  <span>{customer.city}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden sm:table-cell">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="truncate max-w-[200px]">{customer.contactEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span>{customer.contactPhone}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span>{customer.city}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 max-w-[200px] hidden xl:table-cell">
                              <span className="truncate block">{customer.address}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Link href={`/customers/${customer.customerId}`} prefetch={true}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </Link>
                                {permissions.canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(customer.customerId)}
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
            {!loading && filteredCustomers.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} {searchQuery ? 'filtered ' : ''}customers
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

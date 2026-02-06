"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Plus, Pencil, Trash2, Mail, Phone, UserCog, Users, Calendar, LogIn, Search, RefreshCw } from "lucide-react"
import Link from "next/link"
import { getEmployees, deleteEmployee, getTodayLogins, type Employee } from "@/lib/api/admin"
import { getUserContext } from "@/lib/utils/user-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePermissions } from "@/hooks/use-permissions"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useMemo } from "react"

export default function EmployeesPage() {
  const router = useRouter()
  const permissions = usePermissions()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [todayLogins, setTodayLogins] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Wait for permissions to load
    if (permissions.isLoading) {
      return
    }
    
    // Check if user is admin
    if (!permissions.isAdmin) {
      router.push("/dashboard")
      return
    }
    
    loadEmployees()
    
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
  }, [permissions.isAdmin, permissions.isLoading])

  const loadEmployees = async () => {
    try {
      setError("") // Clear any previous errors
      const [employeesResult, todayLoginsResult] = await Promise.all([
        getEmployees(),
        getTodayLogins()
      ])

      if (employeesResult.success && employeesResult.data) {
        setEmployees(employeesResult.data)
        setCurrentPage(1)
      } else {
        const errorMessage = employeesResult.message || "Failed to load employees"
        setError(errorMessage)
      }

      if (todayLoginsResult.success && todayLoginsResult.data) {
        setTodayLogins(todayLoginsResult.data)
      }
    } catch (error) {
      console.error("[v0] Error loading employees:", error)
      setError("Unable to load employees. API may be unavailable or not responding.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee? They will lose access to the system.")) return

    const result = await deleteEmployee(id)

    if (result.success) {
      loadEmployees()
      setCurrentPage(1)
    } else {
      setError(result.message || "Failed to delete employee")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) {
      return employees
    }
    
    const query = searchQuery.toLowerCase()
    return employees.filter(employee => 
      (employee.firstName || '').toLowerCase().includes(query) ||
      (employee.lastName || '').toLowerCase().includes(query) ||
      (employee.userName || '').toLowerCase().includes(query) ||
      (employee.email || '').toLowerCase().includes(query) ||
      (employee.phoneNumber || '').toLowerCase().includes(query) ||
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(query)
    )
  }, [employees, searchQuery])

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex)

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

  // Show loading while checking permissions
  if (permissions.isLoading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <DashboardSidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <p className="text-slate-600">Loading...</p>
          </main>
        </div>
      </div>
    )
  }

  // Redirect if not admin
  if (!permissions.isAdmin && !loading) {
    return null
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
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
                </div>
                <p className="text-slate-600">Manage your staff members and their access</p>
              </div>
              <Link href="/employees/new" prefetch={true}>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add Employee
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
            {!loading && employees.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search by name, username, email, or phone..." 
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

            {/* Today's Logins */}
            {todayLogins.length > 0 && (
              <Card className="bg-white border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <LogIn className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Today's Logins</h3>
                        <p className="text-sm text-slate-600">
                          {todayLogins.length} {todayLogins.length === 1 ? 'employee has' : 'employees have'} logged in today
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      {todayLogins.map((employee) => (
                        <Badge key={employee.id} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                          {employee.firstName} {employee.lastName}
                          {/* Temporarily removed until LastLoginTime column is added to database */}
                          {/* {employee.lastLoginTime && (
                            <span className="ml-1 text-xs">
                              ({new Date(employee.lastLoginTime).toLocaleTimeString()})
                            </span>
                          )} */}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content */}
            {loading ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-600">Loading employees...</p>
                </CardContent>
              </Card>
            ) : filteredEmployees.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No employees found</h3>
                  <p className="text-slate-600 mb-6">
                    {searchQuery ? `No employees match "${searchQuery}"` : "Get started by adding your first employee"}
                  </p>
                  {!searchQuery && (
                    <Link href="/employees/new" prefetch={true}>
                      <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                        Add Your First Employee
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
            ) : employees.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No employees found</h3>
                  <p className="text-slate-600 mb-6">Get started by adding your first employee</p>
                  <Link href="/employees/new" prefetch={true}>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      Add Your First Employee
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
                          <TableHead className="font-semibold text-slate-900 min-w-[150px] hidden sm:table-cell">Username</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[200px] hidden md:table-cell">Email</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[150px] hidden lg:table-cell">Phone</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[100px] hidden xl:table-cell">Status</TableHead>
                          <TableHead className="font-semibold text-slate-900 min-w-[120px] hidden xl:table-cell">Created</TableHead>
                          <TableHead className="font-semibold text-slate-900 text-center min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentEmployees.map((employee) => (
                          <TableRow key={employee.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-medium text-slate-900">
                              {employee.firstName} {employee.lastName}
                            </TableCell>
                            <TableCell className="text-slate-600 hidden sm:table-cell">
                              @{employee.userName}
                            </TableCell>
                            <TableCell className="text-slate-600 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="truncate max-w-[200px]">{employee.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span>{employee.phoneNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <Badge 
                                variant={employee.emailConfirmed ? "default" : "secondary"}
                                className={employee.emailConfirmed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                              >
                                {employee.emailConfirmed ? "Active" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-600 text-sm hidden xl:table-cell">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span>{formatDate(employee.createdDate)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    router.push(`/employees/${employee.id}`)
                                  }}
                                  title="Edit employee"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    handleDelete(employee.id)
                                  }}
                                  title="Delete employee"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
            {!loading && filteredEmployees.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} {searchQuery ? 'filtered ' : ''}employees
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


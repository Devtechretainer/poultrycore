"use client"

import { useEffect, useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, FileText } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { AuditLogsService } from "@/lib/services/audit-logs.service"
import { getUserContext } from "@/lib/utils/user-context"

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId: string
  details: string
  ipAddress: string
  userAgent: string
  timestamp: string
  status: "Success" | "Failed"
}

export default function AuditLogsPage() {
  const { user, logout } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"All" | "Success" | "Failed">("All")

  const handleLogout = () => {
    logout()
  }

  	useEffect(() => {
    const fetchLogs = async () => {
       try {
         setLoading(true)
         setError("")
         
         console.log("Starting to fetch audit logs...")
         
         // Set a timeout to prevent infinite loading
         const timeoutId = setTimeout(() => {
           setLoading(false)
           setError("Request timeout. The audit logs API may not be responding.")
           setLogs([])
         }, 10000) // 10 second timeout
         
         // Ensure apiClient has the token
         const token = localStorage.getItem("auth_token")
         console.log("Token exists:", !!token)
         
         if (token) {
           const { apiClient } = await import('@/lib/api/client')
           apiClient.setToken(token)
           console.log("Synced token with apiClient")
         }
         
         // Get farmId from user context
         const { farmId, userId } = getUserContext()
         
         if (!farmId) {
           setError("Farm ID not found. Please log in again.")
           setLoading(false)
           return
         }
         
         console.log("Calling AuditLogsService.getAll with farmId:", farmId)
         const data = await AuditLogsService.getAll({
           farmId,
           userId,
           page: 1,
           pageSize: 200,
         })
         
         clearTimeout(timeoutId)
         console.log("Audit logs data received:", data)
         
         if (data && Array.isArray(data)) {
           setLogs(data)
           console.log(`Loaded ${data.length} audit logs`)
         } else {
           console.warn("Received non-array data:", data)
           setLogs([])
         }
       } catch (err: any) {
         console.error("Error loading audit logs:", err)
         const errorMsg = err?.message || "Failed to load audit logs. Please check your connection."
         setError(errorMsg)
         setLogs([])
       } finally {
         setLoading(false)
       }
    }

    // Always attempt to load, even if user context hasn't hydrated yet
    fetchLogs()
  }, [user])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === "All" || log.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const friendlyAction = (method: string) => {
    switch ((method || '').toUpperCase()) {
      case 'GET':
        return 'Viewed'
      case 'POST':
        return 'Created'
      case 'PUT':
        return 'Updated'
      case 'DELETE':
        return 'Deleted'
      default:
        return method
    }
  }

  const displayUser = (name?: string) => {
    if (name && name.toLowerCase() !== 'unknown') return name
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('username') || localStorage.getItem('userName')
      if (local) return local
    }
    return 'Unknown'
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <DashboardSidebar onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
              <p className="text-slate-600 mt-1">Track all user activities and system events</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("All")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "Success" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("Success")}
              >
                Success
              </Button>
              <Button
                variant={filterStatus === "Failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("Failed")}
              >
                Failed
              </Button>
            </div>

            {/* Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Recent system activities and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-slate-500">Loading logs...</div>
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-center py-8">{error}</div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No audit logs found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell>{displayUser(log.userName as any)}</TableCell>
                          <TableCell className="font-medium">{friendlyAction((log as any).action)}</TableCell>
                          <TableCell>{log.resource}</TableCell>
                          <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                          <TableCell>
                            <Badge variant={log.status === "Success" ? "default" : "destructive"}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

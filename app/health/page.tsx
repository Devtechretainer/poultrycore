"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Heart, Droplet, Pill, Search, RefreshCw, Calendar as CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { getFlocks, type Flock } from "@/lib/api/flock"
import { getUserContext } from "@/lib/utils/user-context"
import { getProductionRecords, createProductionRecord, updateProductionRecord, type ProductionRecordInput } from "@/lib/api/production-record"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface HealthRecord {
  id?: number
  flockId: number
  date: string
  vaccination?: string
  medication?: string
  waterConsumption?: number
  notes?: string
}

export default function HealthPage() {
  const router = useRouter()
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [selectedFlockId, setSelectedFlockId] = useState<string>("ALL")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  // Sorting
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Form state
  const [formData, setFormData] = useState<HealthRecord>({
    flockId: 0,
    date: new Date().toISOString().split('T')[0],
    vaccination: "",
    medication: "",
    waterConsumption: undefined,
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) {
      setError("User context not found. Please log in again.")
      setLoading(false)
      return
    }

    try {
      const [flocksRes, prodRecordsRes] = await Promise.all([
        getFlocks(userId, farmId),
        getProductionRecords(userId, farmId),
      ])

      if (flocksRes.success && flocksRes.data) {
        setFlocks(flocksRes.data)
      }

      if (prodRecordsRes.success && prodRecordsRes.data) {
        // Extract health data from production records
        const healthData: HealthRecord[] = prodRecordsRes.data
          .filter((pr: any) => pr.medication && pr.medication !== "None")
          .map((pr: any) => ({
            id: pr.id,
            flockId: pr.flockId || 0,
            date: pr.date,
            medication: pr.medication,
            notes: pr.notes || "",
          }))
        setHealthRecords(healthData)
      }
    } catch (err) {
      setError("Failed to load health records")
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredRecords = useMemo(() => {
    let list = healthRecords

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => 
        r.vaccination?.toLowerCase().includes(q) ||
        r.medication?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
      )
    }

    if (selectedFlockId !== "ALL") {
      list = list.filter(r => r.flockId === parseInt(selectedFlockId))
    }

    if (dateFrom) {
      list = list.filter(r => new Date(r.date) >= dateFrom)
    }

    if (dateTo) {
      list = list.filter(r => new Date(r.date) <= dateTo)
    }

    // Apply sorting
    if (sortField) {
      list = [...list].sort((a, b) => {
        let aVal: any
        let bVal: any
        
        switch (sortField) {
          case "date":
            aVal = new Date(a.date).getTime()
            bVal = new Date(b.date).getTime()
            break
          case "flock":
            aVal = a.flockId
            bVal = b.flockId
            break
          default:
            return 0
        }
        
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return list
  }, [healthRecords, search, selectedFlockId, dateFrom, dateTo, sortField, sortDirection])

  const handleCreate = async () => {
    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) return

    try {
      // Sync to production records
      const prodRecordsRes = await getProductionRecords(userId, farmId)
      if (prodRecordsRes.success && prodRecordsRes.data) {
        const matchingRecord = prodRecordsRes.data.find(
          (pr: any) => pr.flockId === formData.flockId &&
          new Date(pr.date).toISOString().split('T')[0] === formData.date
        )

        const updateData: Partial<ProductionRecordInput> = {
          medication: formData.medication || "None",
        }

        if (matchingRecord) {
          await updateProductionRecord(matchingRecord.id, updateData)
        } else {
          // Create new production record with health data
          const flock = flocks.find(f => f.flockId === formData.flockId)
          if (flock) {
            const startDate = new Date(flock.startDate)
            const recordDate = new Date(formData.date)
            const ageDays = Math.floor((recordDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            const ageWeeks = Math.floor(ageDays / 7)

            const prodInput: ProductionRecordInput = {
              farmId,
              userId,
              createdBy: userId,
              updatedBy: userId,
              ageInWeeks: ageWeeks,
              ageInDays: ageDays,
              date: formData.date + 'T00:00:00Z',
              noOfBirds: flock.quantity || 0,
              mortality: 0,
              noOfBirdsLeft: flock.quantity || 0,
              feedKg: 0,
              medication: formData.medication || "None",
              production9AM: 0,
              production12PM: 0,
              production4PM: 0,
              totalProduction: 0,
              flockId: formData.flockId,
            }
            await createProductionRecord(prodInput)
          }
        }
      }

      setIsCreateDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError("Failed to create health record")
    }
  }

  const handleUpdate = async () => {
    if (!editingRecord) return

    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) return

    try {
      const prodRecordsRes = await getProductionRecords(userId, farmId)
      if (prodRecordsRes.success && prodRecordsRes.data) {
        const matchingRecord = prodRecordsRes.data.find(
          (pr: any) => pr.flockId === formData.flockId &&
          new Date(pr.date).toISOString().split('T')[0] === formData.date
        )

        if (matchingRecord) {
          const updateData: Partial<ProductionRecordInput> = {
            medication: formData.medication || "None",
          }
          await updateProductionRecord(matchingRecord.id, updateData)
        }
      }

      setIsEditDialogOpen(false)
      setEditingRecord(null)
      resetForm()
      loadData()
    } catch (err) {
      setError("Failed to update health record")
    }
  }

  const handleDelete = async (record: HealthRecord) => {
    if (!confirm("Are you sure you want to delete this health record?")) return

    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) return

    try {
      const prodRecordsRes = await getProductionRecords(userId, farmId)
      if (prodRecordsRes.success && prodRecordsRes.data) {
        const matchingRecord = prodRecordsRes.data.find(
          (pr: any) => pr.id === record.id
        )

        if (matchingRecord) {
          const updateData: Partial<ProductionRecordInput> = {
            medication: "None",
          }
          await updateProductionRecord(matchingRecord.id, updateData)
        }
      }

      loadData()
    } catch (err) {
      setError("Failed to delete health record")
    }
  }

  const resetForm = () => {
    setFormData({
      flockId: 0,
      date: new Date().toISOString().split('T')[0],
      vaccination: "",
      medication: "",
      waterConsumption: undefined,
      notes: "",
    })
  }

  const openEditDialog = (record: HealthRecord) => {
    setEditingRecord(record)
    setFormData({
      flockId: record.flockId,
      date: record.date.split('T')[0],
      vaccination: record.vaccination || "",
      medication: record.medication || "",
      waterConsumption: record.waterConsumption,
      notes: record.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedFlockId("ALL")
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  const getFlockName = (flockId: number) => {
    const flock = flocks.find(f => f.flockId === flockId)
    return flock?.name || `Flock ${flockId}`
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
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Health Records</h1>
                </div>
                <p className="text-slate-600">Track vaccinations, medications, and water consumption</p>
              </div>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                  setIsCreateDialogOpen(open)
                  if (!open) resetForm()
                }}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Add Health Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Health Record</DialogTitle>
                    <DialogDescription>
                      Record daily health information for your flocks
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="flockId">Flock *</Label>
                        <Select
                          value={formData.flockId.toString()}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, flockId: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select flock" />
                          </SelectTrigger>
                          <SelectContent>
                            {flocks.map(flock => (
                              <SelectItem key={flock.flockId} value={flock.flockId.toString()}>
                                {flock.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vaccination">Vaccination</Label>
                      <Input
                        id="vaccination"
                        placeholder="e.g., Newcastle Disease Vaccine"
                        value={formData.vaccination}
                        onChange={(e) => setFormData(prev => ({ ...prev, vaccination: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medication">Medication</Label>
                      <Input
                        id="medication"
                        placeholder="e.g., Antibiotics, Vitamins"
                        value={formData.medication}
                        onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="waterConsumption">Water Consumption (Liters)</Label>
                      <Input
                        id="waterConsumption"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="e.g., 50.5"
                        value={formData.waterConsumption || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, waterConsumption: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional notes about health status"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate}>Create Record</Button>
                  </div>
                </DialogContent>
              </Dialog>
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

              <Select value={selectedFlockId} onValueChange={setSelectedFlockId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Flock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Flocks</SelectItem>
                  {flocks.map(f => (
                    <SelectItem key={f.flockId} value={f.flockId.toString()}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal w-[140px]", !dateFrom && "text-muted-foreground")}>
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
                  <Button variant="outline" className={cn("justify-start text-left font-normal w-[140px]", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM dd") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>

              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Reset
                </Button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-600">Loading health records...</p>
                </CardContent>
              </Card>
            ) : filteredRecords.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <Heart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No health records found</h3>
                  <p className="text-slate-600 mb-6">Get started by adding your first health record</p>
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Add Health Record
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Health Records</CardTitle>
                  <CardDescription>Daily health tracking for your flocks</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => handleSort("date")}
                        >
                          <div className="flex items-center gap-2">
                            Date
                            {sortField === "date" ? (
                              sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => handleSort("flock")}
                        >
                          <div className="flex items-center gap-2">
                            Flock
                            {sortField === "flock" ? (
                              sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Vaccination</TableHead>
                        <TableHead>Medication</TableHead>
                        <TableHead>Water (L)</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record, idx) => (
                        <TableRow key={record.id || idx}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{getFlockName(record.flockId)}</TableCell>
                          <TableCell>
                            {record.vaccination ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                <Pill className="w-3 h-3 mr-1" />
                                {record.vaccination}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.medication ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <Heart className="w-3 h-3 mr-1" />
                                {record.medication}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.waterConsumption ? (
                              <div className="flex items-center gap-1">
                                <Droplet className="w-4 h-4 text-blue-500" />
                                {record.waterConsumption}L
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {record.notes ? (record.notes.length > 50 ? record.notes.substring(0, 50) + '...' : record.notes) : '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(record)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(record)}>
                                <Trash2 className="h-4 w-4" />
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

            {/* Edit Dialog */}
            <Dialog
              open={isEditDialogOpen}
              onOpenChange={(open) => {
                setIsEditDialogOpen(open)
                if (!open) {
                  setEditingRecord(null)
                  resetForm()
                }
              }}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Health Record</DialogTitle>
                  <DialogDescription>
                    Update the health record information
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-flockId">Flock *</Label>
                      <Select
                        value={formData.flockId.toString()}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, flockId: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select flock" />
                        </SelectTrigger>
                        <SelectContent>
                          {flocks.map(flock => (
                            <SelectItem key={flock.flockId} value={flock.flockId.toString()}>
                              {flock.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-date">Date *</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-vaccination">Vaccination</Label>
                    <Input
                      id="edit-vaccination"
                      placeholder="e.g., Newcastle Disease Vaccine"
                      value={formData.vaccination}
                      onChange={(e) => setFormData(prev => ({ ...prev, vaccination: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-medication">Medication</Label>
                    <Input
                      id="edit-medication"
                      placeholder="e.g., Antibiotics, Vitamins"
                      value={formData.medication}
                      onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-waterConsumption">Water Consumption (Liters)</Label>
                    <Input
                      id="edit-waterConsumption"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g., 50.5"
                      value={formData.waterConsumption || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, waterConsumption: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Textarea
                      id="edit-notes"
                      placeholder="Additional notes about health status"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate}>Update Record</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}


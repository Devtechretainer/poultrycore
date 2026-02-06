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
import { Plus, Edit, Trash2, Heart, Droplet, Pill, Search, RefreshCw, Calendar as CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown, Building2, Package } from "lucide-react"
import { getFlocks, type Flock } from "@/lib/api/flock"
import { getHouses, type House } from "@/lib/api/house"
import { getUserContext } from "@/lib/utils/user-context"
import { getHealthRecords, createHealthRecord, updateHealthRecord, deleteHealthRecord, type HealthRecord, type HealthRecordInput } from "@/lib/api/health"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type HealthType = "flock" | "house" | "inventory"

export default function HealthPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<HealthType>("flock")
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [selectedFlockId, setSelectedFlockId] = useState<string>("ALL")
  const [selectedHouseId, setSelectedHouseId] = useState<string>("ALL")
  const [selectedItemId, setSelectedItemId] = useState<string>("ALL")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  // Sorting
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Form state
  const [formData, setFormData] = useState<Partial<HealthRecordInput>>({
    flockId: null,
    houseId: null,
    itemId: null,
    recordDate: new Date().toISOString().split('T')[0],
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
      const [flocksRes, housesRes, healthRes] = await Promise.all([
        getFlocks(userId, farmId),
        getHouses(userId, farmId),
        getHealthRecords(userId, farmId),
      ])

      if (flocksRes.success && flocksRes.data) {
        setFlocks(flocksRes.data)
      }

      if (housesRes.success && housesRes.data) {
        setHouses(housesRes.data)
      }

      // Load inventory items from localStorage (since there's no API yet)
      try {
        const stored = localStorage.getItem("inventory_items")
        if (stored) {
          setInventoryItems(JSON.parse(stored))
        }
      } catch (e) {
        console.warn("Failed to load inventory items from localStorage")
      }

      if (healthRes.success && healthRes.data) {
        setHealthRecords(healthRes.data.map((hr: any) => ({
          id: hr.id || hr.Id,
          flockId: hr.flockId || hr.FlockId,
          houseId: hr.houseId || hr.HouseId,
          itemId: hr.itemId || hr.ItemId,
          recordDate: hr.recordDate || hr.RecordDate || hr.date || hr.Date,
          vaccination: hr.vaccination || hr.Vaccination,
          medication: hr.medication || hr.Medication,
          waterConsumption: hr.waterConsumption || hr.WaterConsumption,
          notes: hr.notes || hr.Notes,
        })))
      }
    } catch (err) {
      console.error("Failed to load health records:", err)
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

    // Filter by active tab type
    if (activeTab === "flock") {
      list = list.filter(r => r.flockId != null && r.houseId == null && r.itemId == null)
    } else if (activeTab === "house") {
      list = list.filter(r => r.houseId != null && r.flockId == null && r.itemId == null)
    } else if (activeTab === "inventory") {
      list = list.filter(r => r.itemId != null && r.flockId == null && r.houseId == null)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => 
        r.vaccination?.toLowerCase().includes(q) ||
        r.medication?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
      )
    }

    if (activeTab === "flock" && selectedFlockId !== "ALL") {
      list = list.filter(r => r.flockId === parseInt(selectedFlockId))
    }

    if (activeTab === "house" && selectedHouseId !== "ALL") {
      list = list.filter(r => r.houseId === parseInt(selectedHouseId))
    }

    if (activeTab === "inventory" && selectedItemId !== "ALL") {
      list = list.filter(r => r.itemId === parseInt(selectedItemId))
    }

    if (dateFrom) {
      list = list.filter(r => {
        const recordDate = r.recordDate || ""
        return recordDate ? new Date(recordDate) >= dateFrom : false
      })
    }

    if (dateTo) {
      list = list.filter(r => {
        const recordDate = r.recordDate || ""
        return recordDate ? new Date(recordDate) <= dateTo : false
      })
    }

    // Apply sorting
    if (sortField) {
      list = [...list].sort((a, b) => {
        let aVal: any
        let bVal: any
        
        switch (sortField) {
          case "date":
            aVal = a.recordDate ? new Date(a.recordDate).getTime() : 0
            bVal = b.recordDate ? new Date(b.recordDate).getTime() : 0
            break
          case "flock":
            aVal = a.flockId || 0
            bVal = b.flockId || 0
            break
          case "house":
            aVal = a.houseId || 0
            bVal = b.houseId || 0
            break
          case "item":
            aVal = a.itemId || 0
            bVal = b.itemId || 0
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
  }, [healthRecords, activeTab, search, selectedFlockId, selectedHouseId, selectedItemId, dateFrom, dateTo, sortField, sortDirection])

  const handleCreate = async () => {
    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) return

    try {
      const input: HealthRecordInput = {
        userId,
        farmId,
        flockId: activeTab === "flock" ? (formData.flockId || null) : null,
        houseId: activeTab === "house" ? (formData.houseId || null) : null,
        itemId: activeTab === "inventory" ? (formData.itemId || null) : null,
        recordDate: formData.recordDate || new Date().toISOString().split('T')[0],
        vaccination: formData.vaccination || null,
        medication: formData.medication || null,
        waterConsumption: formData.waterConsumption || null,
        notes: formData.notes || null,
      }

      const res = await createHealthRecord(input)
      if (res.success) {
        setIsCreateDialogOpen(false)
        resetForm()
        loadData()
      } else {
        setError(res.message || "Failed to create health record")
      }
    } catch (err) {
      console.error("Create error:", err)
      setError("Failed to create health record")
    }
  }

  const handleUpdate = async () => {
    if (!editingRecord || !editingRecord.id) return

    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) return

    try {
      const input: HealthRecordInput = {
        userId,
        farmId,
        flockId: activeTab === "flock" ? (formData.flockId || null) : null,
        houseId: activeTab === "house" ? (formData.houseId || null) : null,
        itemId: activeTab === "inventory" ? (formData.itemId || null) : null,
        recordDate: formData.recordDate || new Date().toISOString().split('T')[0],
        vaccination: formData.vaccination || null,
        medication: formData.medication || null,
        waterConsumption: formData.waterConsumption || null,
        notes: formData.notes || null,
      }

      const res = await updateHealthRecord(editingRecord.id, input)
      if (res.success) {
        setIsEditDialogOpen(false)
        setEditingRecord(null)
        resetForm()
        loadData()
      } else {
        setError(res.message || "Failed to update health record")
      }
    } catch (err) {
      console.error("Update error:", err)
      setError("Failed to update health record")
    }
  }

  const handleDelete = async (record: HealthRecord) => {
    if (!confirm("Are you sure you want to delete this health record?")) return
    if (!record.id) return

    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) return

    try {
      const res = await deleteHealthRecord(record.id, userId, farmId)
      if (res.success) {
        loadData()
      } else {
        setError(res.message || "Failed to delete health record")
      }
    } catch (err) {
      console.error("Delete error:", err)
      setError("Failed to delete health record")
    }
  }

  const resetForm = () => {
    setFormData({
      flockId: null,
      houseId: null,
      itemId: null,
      recordDate: new Date().toISOString().split('T')[0],
      vaccination: "",
      medication: "",
      waterConsumption: undefined,
      notes: "",
    })
  }

  const openEditDialog = (record: HealthRecord) => {
    setEditingRecord(record)
    const recordDate = record.recordDate || ""
    setFormData({
      flockId: record.flockId || null,
      houseId: record.houseId || null,
      itemId: record.itemId || null,
      recordDate: recordDate ? recordDate.split('T')[0] : new Date().toISOString().split('T')[0],
      vaccination: record.vaccination || "",
      medication: record.medication || "",
      waterConsumption: record.waterConsumption || undefined,
      notes: record.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedFlockId("ALL")
    setSelectedHouseId("ALL")
    setSelectedItemId("ALL")
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  const getFlockName = (flockId: number | null | undefined) => {
    if (!flockId) return "-"
    const flock = flocks.find(f => f.flockId === flockId)
    return flock?.name || `Flock ${flockId}`
  }

  const getHouseName = (houseId: number | null | undefined) => {
    if (!houseId) return "-"
    const house = houses.find(h => h.houseId === houseId)
    return house?.name || `House ${houseId}`
  }

  const getItemName = (itemId: number | null | undefined) => {
    if (!itemId) return "-"
    const item = inventoryItems.find(i => i.id === itemId)
    return item?.name || `Item ${itemId}`
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
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Health Records</h1>
                </div>
                <p className="text-slate-600">Track vaccinations, medications, and water consumption for your flocks, houses, and inventory</p>
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
                      Record daily health information for your {activeTab === "flock" ? "flocks" : activeTab === "house" ? "houses" : "inventory items"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      {activeTab === "flock" && (
                        <div className="space-y-2">
                          <Label htmlFor="flockId">Flock *</Label>
                          <Select
                            value={formData.flockId ? formData.flockId.toString() : ""}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, flockId: parseInt(value), houseId: null, itemId: null }))}
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
                      )}
                      {activeTab === "house" && (
                        <div className="space-y-2">
                          <Label htmlFor="houseId">House *</Label>
                          <Select
                            value={formData.houseId ? formData.houseId.toString() : ""}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, houseId: parseInt(value), flockId: null, itemId: null }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select house" />
                            </SelectTrigger>
                            <SelectContent>
                              {houses.map(house => (
                                <SelectItem key={house.houseId} value={house.houseId.toString()}>
                                  {house.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {activeTab === "inventory" && (
                        <div className="space-y-2">
                          <Label htmlFor="itemId">Inventory Item *</Label>
                          <Select
                            value={formData.itemId ? formData.itemId.toString() : ""}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, itemId: parseInt(value), flockId: null, houseId: null }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryItems.map(item => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.recordDate || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vaccination">Vaccination</Label>
                      <Input
                        id="vaccination"
                        placeholder="e.g., Newcastle Disease Vaccine"
                        value={formData.vaccination || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, vaccination: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medication">Medication</Label>
                      <Input
                        id="medication"
                        placeholder="e.g., Antibiotics, Vitamins"
                        value={formData.medication || ""}
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
                        value={formData.notes || ""}
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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HealthType)}>
              <TabsList>
                <TabsTrigger value="flock">
                  <Heart className="w-4 h-4 mr-2" />
                  Flock Health
                </TabsTrigger>
                <TabsTrigger value="house">
                  <Building2 className="w-4 h-4 mr-2" />
                  House Health
                </TabsTrigger>
                <TabsTrigger value="inventory">
                  <Package className="w-4 h-4 mr-2" />
                  Inventory Health
                </TabsTrigger>
              </TabsList>

              <TabsContent value="flock" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="house" className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border">
                  <div className="relative w-full sm:w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>

                  <Select value={selectedHouseId} onValueChange={setSelectedHouseId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="House" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Houses</SelectItem>
                      {houses.map(h => (
                        <SelectItem key={h.houseId} value={h.houseId.toString()}>{h.name}</SelectItem>
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
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border">
                  <div className="relative w-full sm:w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>

                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Items</SelectItem>
                      {inventoryItems.map(item => (
                        <SelectItem key={item.id} value={item.id.toString()}>{item.name}</SelectItem>
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
              </TabsContent>

            </Tabs>

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
                        {activeTab === "flock" && (
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
                        )}
                        {activeTab === "house" && (
                          <TableHead 
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => handleSort("house")}
                          >
                            <div className="flex items-center gap-2">
                              House
                              {sortField === "house" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </TableHead>
                        )}
                        {activeTab === "inventory" && (
                          <TableHead 
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => handleSort("item")}
                          >
                            <div className="flex items-center gap-2">
                              Item
                              {sortField === "item" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </TableHead>
                        )}
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
                          <TableCell>{record.recordDate ? new Date(record.recordDate).toLocaleDateString() : "-"}</TableCell>
                          {activeTab === "flock" && <TableCell>{getFlockName(record.flockId)}</TableCell>}
                          {activeTab === "house" && <TableCell>{getHouseName(record.houseId)}</TableCell>}
                          {activeTab === "inventory" && <TableCell>{getItemName(record.itemId)}</TableCell>}
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
                    {activeTab === "flock" && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-flockId">Flock *</Label>
                        <Select
                          value={formData.flockId ? formData.flockId.toString() : ""}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, flockId: parseInt(value), houseId: null, itemId: null }))}
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
                    )}
                    {activeTab === "house" && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-houseId">House *</Label>
                        <Select
                          value={formData.houseId ? formData.houseId.toString() : ""}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, houseId: parseInt(value), flockId: null, itemId: null }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select house" />
                          </SelectTrigger>
                          <SelectContent>
                            {houses.map(house => (
                              <SelectItem key={house.houseId} value={house.houseId.toString()}>
                                {house.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {activeTab === "inventory" && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-itemId">Inventory Item *</Label>
                        <Select
                          value={formData.itemId ? formData.itemId.toString() : ""}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, itemId: parseInt(value), flockId: null, houseId: null }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map(item => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="edit-date">Date *</Label>
                        <Input
                        id="edit-date"
                        type="date"
                        value={formData.recordDate || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-vaccination">Vaccination</Label>
                    <Input
                      id="edit-vaccination"
                      placeholder="e.g., Newcastle Disease Vaccine"
                      value={formData.vaccination || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, vaccination: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-medication">Medication</Label>
                    <Input
                      id="edit-medication"
                      placeholder="e.g., Antibiotics, Vitamins"
                      value={formData.medication || ""}
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
                      value={formData.notes || ""}
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


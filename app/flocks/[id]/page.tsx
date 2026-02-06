"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bird, Calendar, Users, MapPin, Home } from "lucide-react"
import { getFlock, updateFlock, type FlockInput } from "@/lib/api/flock"
import { getHouses, type House } from "@/lib/api/house"
import { getFlockBatches, type FlockBatch } from "@/lib/api/flock-batch"
import { getUserContext } from "@/lib/utils/user-context"

export default function EditFlockPage() {
  const router = useRouter()
  const params = useParams()
  const flockId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState<FlockInput>({
    farmId: "",
    userId: "",
    name: "",
    startDate: "",
    breed: "",
    quantity: 0,
    active: true,
    houseId: null,
    batchId: 0,
    inactivationReason: "",
    otherReason: "",
    notes: "",
  })

  const [houses, setHouses] = useState<House[]>([])
  const [housesLoading, setHousesLoading] = useState(true)
  const [flockBatches, setFlockBatches] = useState<FlockBatch[]>([])
  const [flockBatchesLoading, setFlockBatchesLoading] = useState(true)
  const [selectedFlockBatch, setSelectedFlockBatch] = useState<FlockBatch | null>(null)
  const [remainingBirds, setRemainingBirds] = useState<number | null>(null)

  useEffect(() => {
    load()
  }, [flockId])

  useEffect(() => {
    if (selectedFlockBatch) {
      setRemainingBirds(selectedFlockBatch.numberOfBirds - formData.quantity)
    } else {
      setRemainingBirds(null)
    }
  }, [formData.quantity, selectedFlockBatch])

  const load = async () => {
    const { farmId, userId } = getUserContext()
    
    if (!farmId || !userId) {
      setError("Farm ID or User ID not found")
      setLoading(false)
      return
    }

    const [flockRes, housesRes, flockBatchesRes] = await Promise.all([
      getFlock(parseInt(flockId), userId, farmId),
      getHouses(userId, farmId),
      getFlockBatches(userId, farmId),
    ])

    if (housesRes.success && Array.isArray(housesRes.data)) setHouses(housesRes.data as House[])
    setHousesLoading(false)

    if (flockBatchesRes.success && Array.isArray(flockBatchesRes.data)) setFlockBatches(flockBatchesRes.data as FlockBatch[])
    setFlockBatchesLoading(false)

    if (flockRes.success && flockRes.data) {
      const flock = flockRes.data
      setFormData({
        farmId: flock.farmId ?? "",
        userId: flock.userId ?? "",
        name: flock.name ?? "",
        startDate: flock.startDate?.split('T')[0] ?? "",
        breed: flock.breed ?? "",
        quantity: flock.quantity ?? 0,
        active: flock.active ?? false,
        houseId: (flock as any).houseId ?? null,
        batchId: (flock as any).batchId ?? 0,
        inactivationReason: (flock as any).inactivationReason ?? "",
        otherReason: (flock as any).otherReason ?? "",
        notes: (flock as any).notes ?? "",
      })
      const initialSelectedBatch = flockBatchesRes.data?.find(batch => batch.batchId === flock.batchId) || null
      setSelectedFlockBatch(initialSelectedBatch)
    } else {
      setError(flockRes.message || "Failed to load flock")
    }
    
    setLoading(false)
  }

  const handleInputChange = (field: keyof FlockInput, value: string | number | boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as any
    }))
  }

  const handleFlockBatchChange = (batchId: number | null) => {
    const selected = flockBatches.find(batch => batch.batchId === batchId) || null
    setSelectedFlockBatch(selected)
    handleInputChange("batchId", batchId || 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { farmId, userId } = getUserContext()
    
    if (!farmId || !userId) {
      setError("Farm ID or User ID not found")
      return
    }

    if (!formData.name.trim() || !formData.breed.trim() || !formData.startDate) {
      setError("Please fill in all required fields")
      return
    }

    if (formData.quantity <= 0) {
      setError("Quantity must be greater than 0")
      return
    }

    if (selectedFlockBatch && formData.quantity > selectedFlockBatch.numberOfBirds) {
      setError("Quantity cannot be greater than the available birds in the selected batch")
      return
    }

    setSaving(true)
    setError("")

    const flockData: Partial<FlockInput> = {
      name: formData.name,
      startDate: formData.startDate + 'T00:00:00Z',
      breed: formData.breed,
      quantity: formData.quantity,
      active: formData.active,
      houseId: formData.houseId ?? null,
      batchId: formData.batchId ?? 0,
      farmId, // ensure backend receives FarmId
      userId, // ensure backend receives UserId
      inactivationReason: formData.inactivationReason,
      otherReason: formData.inactivationReason === 'other' ? formData.otherReason : '',
      notes: formData.notes,
    }

    const result = await updateFlock(parseInt(flockId), flockData)

    if (result.success) {
      router.push("/flocks")
    } else {
      setError(result.message || "Failed to update flock")
      setSaving(false)
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

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <DashboardSidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bird className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Edit Flock</h1>
                  <p className="text-slate-600">Loading flock information...</p>
                </div>
              </div>
              <div className="space-y-4 p-6 bg-white rounded-lg shadow-sm">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="h-11 bg-slate-200 rounded mb-4"></div>
                  <div className="h-11 bg-slate-200 rounded mb-4"></div>
                  <div className="h-11 bg-slate-200 rounded mb-4"></div>
                  <div className="h-11 bg-slate-200 rounded"></div>
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
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Bird className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Flock</h1>
                <p className="text-slate-600">Update the flock information below</p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4 p-6 bg-white rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Flock Information</h3>
                <p className="text-sm text-slate-600">
                  Update the information for this flock
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="batchId" className="text-sm font-medium text-slate-700">
                      Assign to Flock Batch
                    </Label>
                    <div className="relative">
                      <select
                        id="batchId"
                        className="w-full h-11 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.batchId ?? ''}
                        onChange={(e) => handleFlockBatchChange(e.target.value ? parseInt(e.target.value) : null)}
                        disabled={saving || flockBatchesLoading}
                      >
                        <option value="">No batch</option>
                        {flockBatches.map(batch => (
                          <option key={batch.batchId} value={batch.batchId}>{batch.batchName}</option>
                        ))}
                      </select>
                      <Users className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    </div>
                    {selectedFlockBatch && (
                      <p className="text-sm text-slate-500">
                        Available: {selectedFlockBatch.numberOfBirds} birds
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g., Flock A - Rhode Island Reds"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="breed" className="text-sm font-medium text-slate-700">
                      Breed *
                    </Label>
                    <Input
                      id="breed"
                      type="text"
                      placeholder="e.g., Rhode Island Red"
                      value={formData.breed}
                      onChange={(e) => handleInputChange("breed", e.target.value)}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                      Start Date *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-medium text-slate-700">
                      Number of Birds *
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="e.g., 100"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="houseId" className="text-sm font-medium text-slate-700">
                      Assign to House
                    </Label>
                    <div className="relative">
                      <select
                        id="houseId"
                        className="w-full h-11 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.houseId ?? ''}
                        onChange={(e) => handleInputChange("houseId", e.target.value ? parseInt(e.target.value) : null)}
                        disabled={saving || housesLoading}
                      >
                        <option value="">No house</option>
                        {houses.map((h) => (
                          <option key={h.houseId} value={h.houseId}>{(h as any).houseName || (h as any).name}</option>
                        ))}
                      </select>
                      <Home className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => handleInputChange("active", checked)}
                    disabled={saving}
                  />
                  <Label htmlFor="active" className="text-sm font-medium text-slate-700">
                    Active Flock
                  </Label>
                  <p className="text-sm text-slate-500 ml-2">
                    (Uncheck if this flock is no longer active)
                  </p>
                </div>
                {!formData.active && (
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="inactivationReason" className="text-sm font-medium text-slate-700">
                        Reason for Inactivation
                      </Label>
                      <select
                        id="inactivationReason"
                        className="w-full h-11 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.inactivationReason}
                        onChange={(e) => handleInputChange("inactivationReason", e.target.value)}
                        disabled={saving}
                      >
                        <option value="">Select a reason</option>
                        <option value="all flock sold">All flock sold</option>
                        <option value="all flocks on the market">All flocks on the market</option>
                        <option value="disease outbreak">Disease outbreak</option>
                        <option value="end of production cycle">End of production cycle</option>
                        <option value="relocation">Relocation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {formData.inactivationReason === "other" && (
                      <div className="space-y-2">
                        <Label htmlFor="otherReason" className="text-sm font-medium text-slate-700">
                          Other Reason
                        </Label>
                        <Input
                          id="otherReason"
                          type="text"
                          placeholder="Please specify the reason"
                          value={formData.otherReason}
                          onChange={(e) => handleInputChange("otherReason", e.target.value)}
                          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                          disabled={saving}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                    Notes (Optional)
                  </Label>
                  <textarea
                    id="notes"
                    placeholder="Add any additional notes about the flock"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 border-slate-200"
                  disabled={saving}
                  onClick={() => router.push("/flocks")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Flock"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

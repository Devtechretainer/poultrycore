"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Egg } from "lucide-react"
import { getEggProduction, updateEggProduction, type EggProductionInput } from "@/lib/api/egg-production"
import { getFlockBatches, type FlockBatch } from "@/lib/api/flock-batch"
import { getUserContext } from "@/lib/utils/user-context"
import { getProductionRecords, createProductionRecord, updateProductionRecord, type ProductionRecordInput } from "@/lib/api/production-record"
import { getFlocks } from "@/lib/api/flock"

export default function EditEggProductionPage() {
  const router = useRouter()
  const params = useParams()
  const productionId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [flockBatches, setFlockBatches] = useState<FlockBatch[]>([])

  const [formData, setFormData] = useState<Partial<EggProductionInput>>({
    flockId: 0,
    productionDate: "",
    eggCount: 0,
    production9AM: 0,
    production12PM: 0,
    production4PM: 0,
    brokenEggs: 0,
    notes: "",
  })

  const totalProduction = useMemo(() => {
    return (formData.production9AM || 0) + (formData.production12PM || 0) + (formData.production4PM || 0);
  }, [formData.production9AM, formData.production12PM, formData.production4PM]);

  useEffect(() => {
    load()
  }, [productionId])

  const load = async () => {
    const { farmId, userId } = getUserContext()
    
    if (!farmId || !userId) {
      setError("Farm ID or User ID not found")
      setLoading(false)
      return
    }

    const [eggProductionRes, flocksRes] = await Promise.all([
        getEggProduction(parseInt(productionId), userId, farmId),
        getFlockBatches(userId, farmId)
    ])

    if (eggProductionRes.success && eggProductionRes.data) {
      const eggProd = eggProductionRes.data
      setFormData({
        ...eggProd,
        productionDate: eggProd.productionDate.split('T')[0],
      })
    } else {
      setError(eggProductionRes.message || "Failed to load production data")
    }

    if(flocksRes.success && flocksRes.data) {
        setFlockBatches(flocksRes.data)
    }
    
    setLoading(false)
  }

  const handleInputChange = (field: keyof EggProductionInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { farmId, userId } = getUserContext()
    
    if (!farmId || !userId) {
      setError("Farm ID or User ID not found")
      return
    }

    if (!formData.flockId || formData.flockId <= 0) {
      setError("Please select a flock")
      return
    }

    // Client-side validation for production numbers
    if (formData.production9AM === null || formData.production9AM === undefined || isNaN(formData.production9AM) || formData.production9AM < 0) {
      setError("Production at 9 AM must be a non-negative number.")
      return
    }
    if (formData.production12PM === null || formData.production12PM === undefined || isNaN(formData.production12PM) || formData.production12PM < 0) {
      setError("Production at 12 PM must be a non-negative number.")
      return
    }
    if (formData.production4PM === null || formData.production4PM === undefined || isNaN(formData.production4PM) || formData.production4PM < 0) {
      setError("Production at 4 PM must be a non-negative number.")
      return
    }

    setSaving(true)
    setError("")

    const result = await updateEggProduction(parseInt(productionId), { ...formData, eggCount: totalProduction, totalProduction, farmId, userId })
    
    if (result.success) {
      // Sync to production records
      try {
        const prodRecordsRes = await getProductionRecords(userId, farmId)
        const flocksRes = await getFlocks(userId, farmId)
        const flock = flocksRes.success && flocksRes.data 
          ? flocksRes.data.find((f: any) => f.flockId === formData.flockId || f.batchId === formData.flockId)
          : null

        if (prodRecordsRes.success && prodRecordsRes.data) {
          const matchingRecord = prodRecordsRes.data.find(
            (pr: any) => (pr.flockId === formData.flockId || (flock && pr.flockId === flock.flockId)) &&
            new Date(pr.date).toISOString().split('T')[0] === formData.productionDate
          )

          if (matchingRecord) {
            // Update existing production record with egg production data
            const updateData: Partial<ProductionRecordInput> = {
              production9AM: formData.production9AM || 0,
              production12PM: formData.production12PM || 0,
              production4PM: formData.production4PM || 0,
              totalProduction: totalProduction,
            }
            await updateProductionRecord(matchingRecord.id, updateData)
          }
        }
      } catch (syncError) {
        console.error("Error syncing to production records:", syncError)
        // Don't fail the whole operation if sync fails
      }

      router.push("/egg-production")
    } else {
      setError(result.message || "An unknown error occurred")
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
      <div className="flex h-screen bg-slate-100">
        <DashboardSidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="animate-pulse">
                <div className="h-10 w-1/2 bg-slate-200 rounded mb-6"></div>
                <div className="p-6 bg-white rounded-lg shadow-sm space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="h-11 bg-slate-200 rounded"></div>
                    <div className="h-11 bg-slate-200 rounded"></div>
                    <div className="h-11 bg-slate-200 rounded"></div>
                    <div className="h-11 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <DashboardSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Egg className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Production Record</h1>
                <p className="text-slate-600">Update the egg production details below</p>
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
                <h3 className="text-lg font-semibold text-slate-900">Production Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="flockId">Flock *</Label>
                    <Select
                      value={formData.flockId?.toString()}
                      onValueChange={(value) => handleInputChange("flockId", parseInt(value))}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a flock" />
                      </SelectTrigger>
                      <SelectContent>
                        {flockBatches.map(flock => (
                          <SelectItem key={flock.batchId} value={flock.batchId.toString()}>
                            {flock.batchName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productionDate">Production Date *</Label>
                    <Input
                      id="productionDate"
                      type="date"
                      value={formData.productionDate}
                      onChange={(e) => handleInputChange("productionDate", e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalProduction">Total Eggs Collected</Label>
                    <Input
                      id="totalProduction"
                      type="number"
                      min="0"
                      value={totalProduction}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brokenEggs">Broken Eggs</Label>
                    <Input
                      id="brokenEggs"
                      type="number"
                      min="0"
                      value={formData.brokenEggs}
                      onChange={(e) => handleInputChange("brokenEggs", parseInt(e.target.value) || 0)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="production9AM">Production at 9 AM</Label>
                        <Input id="production9AM" type="number" min="0" value={formData.production9AM} onChange={(e) => handleInputChange("production9AM", parseInt(e.target.value) || 0)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="production12PM">Production at 12 PM</Label>
                        <Input id="production12PM" type="number" min="0" value={formData.production12PM} onChange={(e) => handleInputChange("production12PM", parseInt(e.target.value) || 0)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="production4PM">Production at 4 PM</Label>
                        <Input id="production4PM" type="number" min="0" value={formData.production4PM} onChange={(e) => handleInputChange("production4PM", parseInt(e.target.value) || 0)} disabled={saving} />
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} disabled={saving} />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 border-slate-200"
                  disabled={saving}
                  onClick={() => router.push("/egg-production")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Record"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
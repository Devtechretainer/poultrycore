"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Egg } from "lucide-react"
import { createEggProduction, type EggProductionInput } from "@/lib/api/egg-production"
import { getFlockBatches, type FlockBatch } from "@/lib/api/flock-batch"
import { getUserContext } from "@/lib/utils/user-context"
import { getProductionRecords, createProductionRecord, updateProductionRecord, type ProductionRecordInput } from "@/lib/api/production-record"
import { getFlocks } from "@/lib/api/flock"

export default function NewEggProductionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [flockBatches, setFlockBatches] = useState<FlockBatch[]>([])

  const [formData, setFormData] = useState<Omit<EggProductionInput, 'farmId' | 'userId' | 'totalProduction'>>({
    flockId: 0,
    productionDate: new Date().toISOString().split('T')[0],
    eggCount: 0,
    production9AM: 0,
    production12PM: 0,
    production4PM: 0,
    brokenEggs: 0,
    notes: "",
  })

  const totalProduction = useMemo(() => {
    return formData.production9AM + formData.production12PM + formData.production4PM;
  }, [formData.production9AM, formData.production12PM, formData.production4PM]);


  useEffect(() => {
    loadFlocks()
  }, [])

  const loadFlocks = async () => {
    const { farmId, userId } = getUserContext()
    if (!farmId || !userId) return
    const res = await getFlockBatches(userId, farmId)
    if (res.success && res.data) {
      setFlockBatches(res.data)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
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

    if (formData.flockId <= 0) {
      setError("Please select a flock")
      return
    }

    setLoading(true)
    setError("")

    const eggProductionData: EggProductionInput = {
      ...formData,
      eggCount: totalProduction,
      totalProduction,
      farmId,
      userId,
    }

    const result = await createEggProduction(eggProductionData)
    
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
              production9AM: formData.production9AM,
              production12PM: formData.production12PM,
              production4PM: formData.production4PM,
              totalProduction: totalProduction,
            }
            await updateProductionRecord(matchingRecord.id, updateData)
          } else {
            // Create a production record with egg production data
            if (flock) {
              const startDate = new Date(flock.startDate)
              const prodDate = new Date(formData.productionDate)
              const ageDays = Math.floor((prodDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
              const ageWeeks = Math.floor(ageDays / 7)

              const prodInput: ProductionRecordInput = {
                farmId,
                userId,
                createdBy: userId,
                updatedBy: userId,
                ageInWeeks: ageWeeks,
                ageInDays: ageDays,
                date: formData.productionDate + 'T00:00:00Z',
                noOfBirds: flock.quantity || 0,
                mortality: 0,
                noOfBirdsLeft: flock.quantity || 0,
                feedKg: 0,
                medication: "None",
                production9AM: formData.production9AM,
                production12PM: formData.production12PM,
                production4PM: formData.production4PM,
                totalProduction: totalProduction,
                flockId: flock.flockId || formData.flockId,
              }
              await createProductionRecord(prodInput)
            }
          }
        }
      } catch (syncError) {
        console.error("Error syncing to production records:", syncError)
        // Don't fail the whole operation if sync fails
      }

      router.push("/egg-production")
    } else {
      setError(result.message || "An unknown error occurred")
      setLoading(false)
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
                <h1 className="text-2xl font-bold text-slate-900">Add New Production Record</h1>
                <p className="text-slate-600">Enter the egg production details below</p>
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
                      onValueChange={(value) => handleInputChange("flockId", parseInt(value))}
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="production9AM">Production at 9 AM</Label>
                        <Input id="production9AM" type="number" min="0" value={formData.production9AM} onChange={(e) => handleInputChange("production9AM", parseInt(e.target.value) || 0)} disabled={loading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="production12PM">Production at 12 PM</Label>
                        <Input id="production12PM" type="number" min="0" value={formData.production12PM} onChange={(e) => handleInputChange("production12PM", parseInt(e.target.value) || 0)} disabled={loading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="production4PM">Production at 4 PM</Label>
                        <Input id="production4PM" type="number" min="0" value={formData.production4PM} onChange={(e) => handleInputChange("production4PM", parseInt(e.target.value) || 0)} disabled={loading} />
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} disabled={loading} />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 border-slate-200"
                  disabled={loading}
                  onClick={() => router.push("/egg-production")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Record"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
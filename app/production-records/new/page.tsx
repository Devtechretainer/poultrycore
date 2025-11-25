"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { FileText } from "lucide-react"
import { createProductionRecord, type ProductionRecordInput } from "@/lib/api/production-record"
import { getUserContext } from "@/lib/utils/user-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getFlocks } from "@/lib/api/flock"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NewProductionRecordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [flocks, setFlocks] = useState<any[]>([])
  const [selectedFlockId, setSelectedFlockId] = useState<string>("")
  const [formData, setFormData] = useState({
    ageInWeeks: "",
    ageInDays: "",
    date: new Date().toISOString().split("T")[0],
    noOfBirds: "",
    mortality: "",
    feedKg: "",
    medication: "",
    production9AM: "",
    production12PM: "",
    production4PM: "",
  })

  useEffect(() => {
    loadFlocks()
  }, [])

  const loadFlocks = async () => {
    const { userId, farmId } = getUserContext()
    if (userId && farmId) {
      const result = await getFlocks(userId, farmId)
      if (result.success && result.data) {
        setFlocks(result.data)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFlockChange = (flockId: string) => {
    setSelectedFlockId(flockId)
    const flock = flocks.find(f => f.flockId.toString() === flockId)
    if (flock) {
      setFormData({ ...formData, noOfBirds: flock.quantity.toString() })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { userId, farmId } = getUserContext()

    if (!userId || !farmId) {
      setError("User context not found. Please log in again.")
      setLoading(false)
      return
    }

    const totalProduction =
      Number(formData.production9AM) + Number(formData.production12PM) + Number(formData.production4PM)

    const noOfBirdsLeft = Number(formData.noOfBirds) - Number(formData.mortality)

    const record: ProductionRecordInput = {
      farmId,
      userId,
      createdBy: userId,
      updatedBy: userId,
      ageInWeeks: Number(formData.ageInWeeks),
      ageInDays: Number(formData.ageInDays),
      date: new Date(formData.date).toISOString(),
      noOfBirds: Number(formData.noOfBirds),
      mortality: Number(formData.mortality),
      noOfBirdsLeft,
      feedKg: Number(formData.feedKg),
      medication: formData.medication,
      production9AM: Number(formData.production9AM),
      production12PM: Number(formData.production12PM),
      production4PM: Number(formData.production4PM),
      totalProduction,
    }

    const result = await createProductionRecord(record)

    if (result.success) {
      router.push("/production-records")
    } else {
      setError(result.message)
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
      {/* Sidebar */}
      <DashboardSidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Add New Production Record</h1>
                <p className="text-slate-600">Add a new daily production record</p>
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
              {/* Form Fields */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-medium text-slate-700">Date *</Label>
                      <Input 
                        id="date" 
                        name="date" 
                        type="date" 
                        value={formData.date} 
                        onChange={handleChange} 
                        required 
                        disabled={loading}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ageInWeeks" className="text-sm font-medium text-slate-700">Age in Weeks *</Label>
                      <Input
                        id="ageInWeeks"
                        name="ageInWeeks"
                        type="number"
                        value={formData.ageInWeeks}
                        onChange={handleChange}
                        required
                        min="0"
                        disabled={loading}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ageInDays" className="text-sm font-medium text-slate-700">Age in Days *</Label>
                      <Input
                        id="ageInDays"
                        name="ageInDays"
                        type="number"
                        value={formData.ageInDays}
                        onChange={handleChange}
                        required
                        min="0"
                        disabled={loading}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Flock Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Flock Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="flock" className="text-sm font-medium text-slate-700">Select Flock</Label>
                      <Select value={selectedFlockId} onValueChange={handleFlockChange} disabled={loading}>
                        <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select a flock" />
                        </SelectTrigger>
                        <SelectContent>
                          {flocks.map((flock) => (
                            <SelectItem key={flock.flockId} value={flock.flockId.toString()}>
                              {flock.name} ({flock.quantity} birds)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Flock Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Flock Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="noOfBirds" className="text-sm font-medium text-slate-700">Number of Birds *</Label>
                      <Input
                        id="noOfBirds"
                        name="noOfBirds"
                        type="number"
                        value={formData.noOfBirds}
                        onChange={handleChange}
                        required
                        min="0"
                        disabled={loading}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mortality" className="text-sm font-medium text-slate-700">Mortality *</Label>
                      <Input
                        id="mortality"
                        name="mortality"
                        type="number"
                        value={formData.mortality}
                        onChange={handleChange}
                        required
                        min="0"
                        disabled={loading}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Feed & Medication */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Feed & Medication</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="feedKg" className="text-sm font-medium text-slate-700">Feed (kg) *</Label>
                      <Input
                        id="feedKg"
                        name="feedKg"
                        type="number"
                        step="0.01"
                        value={formData.feedKg}
                        onChange={handleChange}
                        required
                        min="0"
                        disabled={loading}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medication" className="text-sm font-medium text-slate-700">Medication</Label>
                      <Input
                        id="medication"
                        name="medication"
                        type="text"
                        value={formData.medication}
                        onChange={handleChange}
                        placeholder="None"
                        disabled={loading}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Production */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Production</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="production9AM" className="text-sm font-medium text-slate-700">9 AM *</Label>
                      <Input
                        id="production9AM"
                        name="production9AM"
                        type="number"
                        value={formData.production9AM}
                        onChange={handleChange}
                        required
                        min="0"
                        disabled={loading}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="production12PM" className="text-sm font-medium text-slate-700">12 PM *</Label>
                      <Input
                        id="production12PM"
                        name="production12PM"
                        type="number"
                        value={formData.production12PM}
                        onChange={handleChange}
                        required
                        min="0"
                        disabled={loading}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="production4PM" className="text-sm font-medium text-slate-700">4 PM *</Label>
                      <Input
                        id="production4PM"
                        name="production4PM"
                        type="number"
                        value={formData.production4PM}
                        onChange={handleChange}
                        required
                        min="0"
                        disabled={loading}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 border-slate-200"
                  disabled={loading}
                  onClick={() => router.push("/production-records")}
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
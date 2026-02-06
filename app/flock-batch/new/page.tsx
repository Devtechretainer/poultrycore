"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bird } from "lucide-react"
import { createFlockBatch, type FlockBatchInput } from "@/lib/api/flock-batch"
import { getUserContext } from "@/lib/utils/user-context"
import { useToast } from "@/hooks/use-toast"

export default function NewFlockBatchPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState<FlockBatchInput>({
    farmId: "",
    userId: "",
    batchName: "",
    batchCode: "",
    startDate: "",
    breed: "",
    numberOfBirds: 0,
  })

  const handleInputChange = (field: keyof FlockBatchInput, value: string | number) => {
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

    if (!formData.batchName.trim() || !formData.batchCode.trim() || !formData.breed.trim() || !formData.startDate) {
      setError("Please fill in all required fields")
      return
    }

    if (formData.numberOfBirds <= 0) {
      setError("Number of birds must be greater than 0")
      return
    }

    setLoading(true)
    setError("")

    const flockBatchData: FlockBatchInput = {
      ...formData,
      farmId,
      userId,
    }

    const result = await createFlockBatch(flockBatchData)
    
    if (result.success) {
      toast({
        title: "Success!",
        description: "Flock batch created successfully.",
      })
      router.push("/flock-batch")
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
    <div className="flex h-screen bg-slate-50">
      <DashboardSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Bird className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Add New Flock Batch</h1>
                <p className="text-slate-600">Enter the flock batch information below</p>
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
                <h3 className="text-lg font-semibold text-slate-900">Flock Batch Information</h3>
                <p className="text-sm text-slate-600">
                  Enter the basic information for the new flock batch
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="batchName" className="text-sm font-medium text-slate-700">
                      Name *
                    </Label>
                    <Input
                      id="batchName"
                      type="text"
                      placeholder="e.g., Batch A - Rhode Island Reds"
                      value={formData.batchName}
                      onChange={(e) => handleInputChange("batchName", e.target.value)}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batchCode" className="text-sm font-medium text-slate-700">
                      Code *
                    </Label>
                    <Input
                      id="batchCode"
                      type="text"
                      placeholder="e.g., B-001"
                      value={formData.batchCode}
                      onChange={(e) => handleInputChange("batchCode", e.target.value)}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfBirds" className="text-sm font-medium text-slate-700">
                      Number of Birds *
                    </Label>
                    <Input
                      id="numberOfBirds"
                      type="number"
                      min="1"
                      placeholder="e.g., 100"
                      value={formData.numberOfBirds}
                      onChange={(e) => handleInputChange("numberOfBirds", parseInt(e.target.value) || 0)}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
                    />
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
                  onClick={() => router.push("/flock-batch")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Flock Batch"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Save } from "lucide-react"
import { SuccessModal } from "@/components/auth/success-modal"

export default function SettingsPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    farmName: "",
    farmLocation: "",
    currency: "GHS",
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Load farm settings from localStorage
      const farmName = localStorage.getItem("farmName") || ""
      const farmLocation = localStorage.getItem("farmLocation") || ""
      const currency = localStorage.getItem("currency") || "GHS"

      setFormData({
        farmName,
        farmLocation,
        currency,
      })
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")

    try {
      // Save to localStorage
      localStorage.setItem("farmName", formData.farmName)
      localStorage.setItem("farmLocation", formData.farmLocation)
      localStorage.setItem("currency", formData.currency.toUpperCase())

      // Here you would typically also save to the backend API
      // await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // })

      setShowSuccess(true)
    } catch (error) {
      setError("Failed to save settings. Please try again.")
    }

    setIsSaving(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
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
    <>
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
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Farm Settings</h1>
                <p className="text-slate-600 mt-1">Update your farm information</p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Settings Card */}
              <Card className="bg-white">
                <CardContent className="p-6 space-y-6">
                  {/* Farm Name */}
                  <div className="space-y-2">
                    <Label htmlFor="farmName" className="text-sm font-medium text-slate-700">
                      Farm Name
                    </Label>
                    <Input
                      id="farmName"
                      value={formData.farmName}
                      onChange={(e) => handleInputChange("farmName", e.target.value)}
                      placeholder="Enter farm name"
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Farm Location */}
                  <div className="space-y-2">
                    <Label htmlFor="farmLocation" className="text-sm font-medium text-slate-700">
                      Farm Location
                    </Label>
                    <Input
                      id="farmLocation"
                      value={formData.farmLocation}
                      onChange={(e) => handleInputChange("farmLocation", e.target.value)}
                      placeholder="Enter farm location"
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium text-slate-700">
                      Currency
                    </Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => handleInputChange("currency", e.target.value)}
                      placeholder="GHS"
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSaving}
                      maxLength={3}
                    />
                    <p className="text-sm text-slate-500">
                      Enter 3-letter currency code (USD, EUR, GBP, GHS, KES, NGN, etc.)
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleSave}
                      className="w-full bg-green-600 hover:bg-green-700 h-11"
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Farm Settings"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {showSuccess && (
        <SuccessModal
          title="Settings Saved Successfully!"
          message="Your farm settings have been updated"
          onClose={() => setShowSuccess(false)}
          buttonText="Continue"
        />
      )}
    </>
  )
}
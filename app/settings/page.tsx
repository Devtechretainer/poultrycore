"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { InfoSection, InfoRow, PageHeader } from "@/components/ui/info-section"
import { Save, Settings, MapPin, DollarSign, Building2 } from "lucide-react"
import { SuccessModal } from "@/components/auth/success-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
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
      localStorage.setItem("farmName", formData.farmName)
      localStorage.setItem("farmLocation", formData.farmLocation)
      localStorage.setItem("currency", formData.currency.toUpperCase())

      setShowSuccess(true)
      setIsEditing(false)
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
      <div className="flex h-screen bg-slate-50">
        <DashboardSidebar onLogout={handleLogout} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <PageHeader 
                title="Farm Settings"
                subtitle="Manage your farm configuration and preferences"
                action={
                  !isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                      <Settings className="w-4 h-4" />
                      Edit Settings
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={() => { setIsEditing(false); loadSettings() }} variant="outline" disabled={isSaving}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        {isSaving ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Saving...
                          </span>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )
                }
              />

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Farm Details */}
                <InfoSection title="Farm details" collapsible={false}>
                  {isEditing ? (
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label className="text-sm text-slate-600">Farm name</Label>
                        <Input
                          value={formData.farmName}
                          onChange={(e) => handleInputChange("farmName", e.target.value)}
                          placeholder="Enter your farm name"
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-slate-600">Farm location</Label>
                        <Input
                          value={formData.farmLocation}
                          onChange={(e) => handleInputChange("farmLocation", e.target.value)}
                          placeholder="Enter farm location"
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <InfoRow 
                        label="Farm name" 
                        value={formData.farmName}
                        icon={<Building2 className="w-4 h-4" />}
                      />
                      <InfoRow 
                        label="Location" 
                        value={formData.farmLocation}
                        icon={<MapPin className="w-4 h-4" />}
                      />
                    </>
                  )}
                </InfoSection>

                {/* Regional Settings */}
                <InfoSection title="Regional settings" collapsible={false}>
                  {isEditing ? (
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label className="text-sm text-slate-600">Currency</Label>
                        <Input
                          value={formData.currency}
                          onChange={(e) => handleInputChange("currency", e.target.value.toUpperCase())}
                          placeholder="GHS"
                          maxLength={3}
                          disabled={isSaving}
                        />
                        <p className="text-xs text-slate-500">
                          3-letter currency code (USD, EUR, GBP, GHS, KES, NGN)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <InfoRow 
                      label="Currency" 
                      value={formData.currency || "GHS"}
                      icon={<DollarSign className="w-4 h-4" />}
                    />
                  )}
                </InfoSection>
              </div>
            </div>
          </main>
        </div>
      </div>

      {showSuccess && (
        <SuccessModal
          title="Settings Saved!"
          message="Your farm settings have been updated successfully"
          onClose={() => setShowSuccess(false)}
          buttonText="Continue"
        />
      )}
    </>
  )
}

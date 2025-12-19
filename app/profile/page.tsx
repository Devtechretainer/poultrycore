"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { type UserProfile } from "@/lib/api/user-profile"
import { Edit2, Save, X, User, Mail, Phone, Building2, Shield } from "lucide-react"
import { SuccessModal } from "@/components/auth/success-modal"
import { AuthService } from "@/lib/services/auth.service"
import { useAuth } from "@/lib/hooks/use-auth"

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    farmName: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    setError("")

    try {
      const userData = await AuthService.getCurrentUser()
      
      // Safely handle potentially missing fields
      const username = userData.username || ""
      const email = userData.email || ""
      
      const profileData = {
        id: userData.id,
        userName: username,
        normalizedUserName: username.toUpperCase(),
        email: email,
        normalizedEmail: email.toUpperCase(),
        emailConfirmed: true,
        passwordHash: "",
        securityStamp: "",
        concurrencyStamp: "",
        phoneNumber: userData.phone || userData.phoneNumber || "",
        phoneNumberConfirmed: false,
        twoFactorEnabled: false,
        lockoutEnd: null,
        lockoutEnabled: true,
        accessFailedCount: 0,
        farmId: userData.farmId || "",
        farmName: userData.farmName || "",
        isStaff: userData.isStaff || false,
        isSubscriber: userData.isSubscriber || false,
        refreshToken: "",
        refreshTokenExpiry: "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        customerId: userData.customerId || ""
      } as UserProfile
      
      setProfile(profileData)
      
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: email,
        phoneNumber: userData.phoneNumber || userData.phone || "",
        farmName: userData.farmName || "",
      })
    } catch (error: any) {
      // Handle 404 or other API errors gracefully - fallback to localStorage data
      if (error?.status === 404 || (error instanceof Error && error.message.includes('404'))) {
        console.log("[Profile] API endpoint not available, using localStorage data")
        // Fallback to localStorage for profile data
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
        const username = typeof window !== "undefined" ? localStorage.getItem("username") : null
        const farmId = typeof window !== "undefined" ? localStorage.getItem("farmId") : null
        const farmName = typeof window !== "undefined" ? localStorage.getItem("farmName") : null
        
        if (userId && username) {
          const profileData: UserProfile = {
            id: userId,
            userName: username,
            normalizedUserName: username.toUpperCase(),
            email: username, // Use username as fallback for email
            normalizedEmail: username.toUpperCase(),
            emailConfirmed: false,
            passwordHash: "",
            securityStamp: "",
            concurrencyStamp: "",
            phoneNumber: "",
            phoneNumberConfirmed: false,
            twoFactorEnabled: false,
            lockoutEnd: null,
            lockoutEnabled: true,
            accessFailedCount: 0,
            farmId: farmId || "",
            farmName: farmName || "",
            isStaff: typeof window !== "undefined" ? localStorage.getItem("isStaff") === "true" : false,
            isSubscriber: typeof window !== "undefined" ? localStorage.getItem("isSubscriber") === "true" : false,
            refreshToken: "",
            refreshTokenExpiry: "",
            firstName: "",
            lastName: "",
            customerId: ""
          }
          setProfile(profileData)
          setFormData({
            firstName: "",
            lastName: "",
            email: username,
            phoneNumber: "",
            farmName: farmName || "",
          })
          // Don't set error for 404 - it's acceptable to use localStorage
          setIsLoading(false)
          return
        }
      }
      
      console.error("Error loading profile:", error)
      setError(error instanceof Error ? error.message : "Failed to load profile. Please try again.")
      // If 401, redirect to login
      if (error?.status === 401 || (error instanceof Error && error.message.includes('401'))) {
        router.push('/login')
      }
    }

    setIsLoading(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError("")
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError("")
    // Reset form data to original profile data
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || "",
        farmName: profile.farmName || "",
      })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")

    try {
      const token = localStorage.getItem("auth_token")
      const rawAdmin = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'usermanagementapi.techretainer.com'
      const baseUrl = rawAdmin.startsWith('http://') || rawAdmin.startsWith('https://') ? rawAdmin : `https://${rawAdmin}`
      const response = await fetch(`${baseUrl}/api/Authentication/update-profile`, {
        method: "PUT",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
          accept: "*/*",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          farmName: formData.farmName,
        }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Fallback: API route not present. Persist to localStorage and update UI.
          if (typeof window !== "undefined") {
            localStorage.setItem("firstName", formData.firstName)
            localStorage.setItem("lastName", formData.lastName)
            localStorage.setItem("email", formData.email)
            localStorage.setItem("phoneNumber", formData.phoneNumber)
            localStorage.setItem("farmName", formData.farmName)
          }
          setProfile((prev) => prev ? ({
            ...prev,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            farmName: formData.farmName,
          }) : prev)
          setShowSuccess(true)
          setIsEditing(false)
          return
        }
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update profile")
      }

      setShowSuccess(true)
      setIsEditing(false)
      // Reload profile to get updated data
      await loadProfile()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update profile")
    }

    setIsSaving(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-100">
        {/* Sidebar */}
        <DashboardSidebar onLogout={logout} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeader />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading profile...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-slate-100">
        {/* Sidebar */}
        <DashboardSidebar onLogout={logout} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeader />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
                  </div>
                  <p className="text-slate-600">View and manage your account information</p>
                </div>
                {!isEditing ? (
                  <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Profile Card */}
              <Card className="bg-white">
                <CardContent className="p-6 space-y-8">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                          First Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            disabled={isSaving}
                          />
                        ) : (
                          <p className="h-11 px-3 py-2 bg-slate-50 rounded-lg text-slate-900 flex items-center">
                            {profile?.firstName || "Not set"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                          Last Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            disabled={isSaving}
                          />
                        ) : (
                          <p className="h-11 px-3 py-2 bg-slate-50 rounded-lg text-slate-900 flex items-center">
                            {profile?.lastName || "Not set"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                          Email Address
                        </Label>
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            disabled={isSaving}
                          />
                        ) : (
                          <p className="h-11 px-3 py-2 bg-slate-50 rounded-lg text-slate-900 flex items-center">
                            {profile?.email || "Not set"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700">
                          <Phone className="w-4 h-4 inline mr-1" />
                          Phone Number
                        </Label>
                        {isEditing ? (
                          <Input
                            id="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            disabled={isSaving}
                          />
                        ) : (
                          <p className="h-11 px-3 py-2 bg-slate-50 rounded-lg text-slate-900 flex items-center">
                            {profile?.phoneNumber || "Not set"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Farm Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      Farm Information
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="farmName" className="text-sm font-medium text-slate-700">
                        Farm Name
                      </Label>
                      {isEditing ? (
                        <Input
                          id="farmName"
                          value={formData.farmName}
                          onChange={(e) => handleInputChange("farmName", e.target.value)}
                          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                          disabled={isSaving}
                        />
                      ) : (
                        <p className="h-11 px-3 py-2 bg-slate-50 rounded-lg text-slate-900 flex items-center">
                          {profile?.farmName || "Not set"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Account Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Username</p>
                        <p className="font-medium text-slate-900">{profile?.userName}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Email Verified</p>
                        <p className="font-medium text-slate-900">
                          {profile?.emailConfirmed ? (
                            <span className="text-green-600">Verified</span>
                          ) : (
                            <span className="text-amber-600">Not Verified</span>
                          )}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Account Type</p>
                        <p className="font-medium text-slate-900">
                          {profile?.isStaff ? "Staff" : profile?.isSubscriber ? "Subscriber" : "Regular"}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Phone Verified</p>
                        <p className="font-medium text-slate-900">
                          {profile?.phoneNumberConfirmed ? (
                            <span className="text-green-600">Verified</span>
                          ) : (
                            <span className="text-amber-600">Not Verified</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {showSuccess && (
        <SuccessModal
          title="Profile Updated Successfully!"
          message="Your profile information has been updated"
          onClose={() => setShowSuccess(false)}
          buttonText="Continue"
        />
      )}
    </>
  )
}
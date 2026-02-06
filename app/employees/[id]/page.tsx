"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { InfoSection, InfoRow, PageHeader } from "@/components/ui/info-section"
import { UserCog, ArrowLeft, Save, Mail, Phone, User } from "lucide-react"
import { getEmployee, updateEmployee, type UpdateEmployeeData } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePermissions } from "@/hooks/use-permissions"

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useParams()
  const permissions = usePermissions()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(true) // Start in edit mode since this is an edit page
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    userName: "",
    createdDate: "",
  })

  const employeeId = params.id as string

  useEffect(() => {
    if (permissions.isLoading) {
      return
    }
    
    if (!permissions.isAdmin) {
      router.push("/dashboard")
      return
    }

    if (employeeId) {
      loadEmployee()
    }
  }, [permissions.isAdmin, permissions.isLoading, employeeId])

  const loadEmployee = async () => {
    try {
      const result = await getEmployee(employeeId)

      if (result.success && result.data) {
        setFormData({
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          phoneNumber: result.data.phoneNumber,
          email: result.data.email,
          userName: result.data.userName || "",
          createdDate: result.data.createdDate || "",
        })
      } else {
        setError(result.message || "Failed to load employee")
      }
    } catch (error) {
      console.error("[v0] Error loading employee:", error)
      setError("Unable to load employee. API may be unavailable.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    const employeeData: UpdateEmployeeData = {
      id: employeeId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
    }

    const result = await updateEmployee(employeeId, employeeData)
    
    if (result.success) {
      router.push("/employees")
    } else {
      setError(result.message || "Failed to update employee")
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

  if (permissions.isLoading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <DashboardSidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!permissions.isAdmin) {
    return null
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <DashboardSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/employees")}
              className="mb-4 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employees
            </Button>

            {/* Page Header */}
            <PageHeader 
              title="Edit Employee"
              subtitle="Update employee information and contact details"
              action={
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/employees")}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={saving || loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
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
              }
            />

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading employee information...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <InfoSection title="Personal information" collapsible={false}>
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-slate-600">First name *</Label>
                        <Input
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="John"
                          required
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-slate-600">Last name *</Label>
                        <Input
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Doe"
                          required
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                </InfoSection>

                {/* Contact Information */}
                <InfoSection title="Contact information" collapsible={false}>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email address *
                      </Label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-600 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone number *
                      </Label>
                      <Input
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>
                </InfoSection>

                {/* Account Information (Read-only) */}
                <InfoSection title="Account information" collapsible={false}>
                  <InfoRow 
                    label="Username" 
                    value={formData.userName ? `@${formData.userName}` : "Not set"}
                    icon={<User className="w-4 h-4" />}
                  />
                  <InfoRow 
                    label="Employee ID" 
                    value={<span className="font-mono text-xs">{employeeId}</span>}
                  />
                  {formData.createdDate && (
                    <InfoRow 
                      label="Created" 
                      value={new Date(formData.createdDate).toLocaleDateString()}
                    />
                  )}
                </InfoSection>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

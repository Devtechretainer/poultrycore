"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { UserCog, ArrowLeft } from "lucide-react"
import { getEmployee, updateEmployee, type UpdateEmployeeData } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent } from "@/components/ui/card"

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useParams()
  const permissions = usePermissions()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  })

  const employeeId = params.id as string

  useEffect(() => {
    // Wait for permissions to load
    if (permissions.isLoading) {
      return
    }
    
    // Check if user is admin
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

  // Show loading while checking permissions
  if (permissions.isLoading) {
    return (
      <div className="flex h-screen bg-slate-100">
        <DashboardSidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <p className="text-slate-600">Loading...</p>
          </main>
        </div>
      </div>
    )
  }

  if (!permissions.isAdmin) {
    return null
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/employees")}
                className="h-10 w-10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Employee</h1>
                <p className="text-slate-600">Update employee information</p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-slate-600">Loading employee information...</p>
                </CardContent>
              </Card>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4 p-6 bg-white rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">Employee Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700">
                        Phone Number *
                      </Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={saving}
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
                    disabled={saving}
                    onClick={() => router.push("/employees")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

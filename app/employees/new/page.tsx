"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { UserCog } from "lucide-react"
import { createEmployee, type CreateEmployeeData } from "@/lib/api"
import { getUserContext } from "@/lib/utils/user-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePermissions } from "@/hooks/use-permissions"

export default function NewEmployeePage() {
  const router = useRouter()
  const permissions = usePermissions()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  })

  useEffect(() => {
    // Wait for permissions to load
    if (permissions.isLoading) {
      return
    }
    
    // Check if user is admin
    if (!permissions.isAdmin) {
      router.push("/dashboard")
    }
  }, [permissions.isAdmin, permissions.isLoading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { userId, farmId } = getUserContext()
    const farmName = localStorage.getItem("farmName") || "My Farm"

    if (!farmId) {
      setError("Farm information not found. Please log in again.")
      setLoading(false)
      return
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    // Validate username - can only contain letters, digits, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(formData.userName)) {
      setError("Username can only contain letters, digits, and underscores (no spaces or other special characters)")
      setLoading(false)
      return
    }

    const employeeData: CreateEmployeeData = {
      userName: formData.userName,
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      farmId: farmId,
      farmName: farmName,
    }

    const result = await createEmployee(employeeData)
    
    if (result.success) {
      router.push("/employees")
    } else {
      const errorMessage = result.message || "Failed to create employee"
      setError(errorMessage)
      setLoading(false)
      
      // If session expired, redirect to login after a delay
      if (errorMessage.includes("session has expired") || errorMessage.includes("session expired")) {
        setTimeout(() => {
          handleLogout()
        }, 3000)
      }
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
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Add Employee</h1>
                <p className="text-slate-600">Create a new staff member with limited access</p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Info Alert */}
            <Alert>
              <AlertDescription>
                Employees will have access to view, create, and edit records, but cannot delete data.
              </AlertDescription>
            </Alert>

            {/* Form */}
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-sm font-medium text-slate-700">
                      Username * (letters and digits only)
                    </Label>
                    <Input
                      id="userName"
                      name="userName"
                      type="text"
                      value={formData.userName}
                      onChange={handleChange}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
                      placeholder="james_quayson"
                      pattern="[a-zA-Z0-9_]+"
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
                      disabled={loading}
                      placeholder="employee@example.com"
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
                      disabled={loading}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                      Confirm Password *
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
                      placeholder="Re-enter password"
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
                  onClick={() => router.push("/employees")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Employee"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}


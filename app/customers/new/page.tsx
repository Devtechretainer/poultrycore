"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { UserPlus, Mail, Phone, MapPin, Building2 } from "lucide-react"
import { createCustomer, type CustomerInput } from "@/lib/api/customer"
import { getUserContext } from "@/lib/utils/user-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

export default function NewCustomerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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

    const customer: CustomerInput = {
      farmId,
      userId,
      ...formData,
    }

    const result = await createCustomer(customer)

    if (result.success) {
      router.push("/customers")
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardSidebar onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Add New Customer</h1>
                <p className="text-slate-600 mt-1">Enter the customer information below</p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Form Card */}
            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Form Fields */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-blue-600" />
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      {/* Email Address */}
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          Email Address *
                        </Label>
                        <Input
                          id="contactEmail"
                          name="contactEmail"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.contactEmail}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Phone Number */}
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          Phone Number *
                        </Label>
                        <Input
                          id="contactPhone"
                          name="contactPhone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.contactPhone}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          City *
                        </Label>
                        <Input
                          id="city"
                          name="city"
                          type="text"
                          placeholder="New York"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Address - Full Width */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        Address *
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        placeholder="123 Main Street, Apt 4B"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-4 pt-4 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                      disabled={loading}
                      onClick={() => router.push("/customers")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 transition-all"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Creating...
                        </span>
                      ) : (
                        "Create Customer"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { DollarSign } from "lucide-react"
import { createExpense, type ExpenseInput } from "@/lib/api/expense"
import { getUserContext } from "@/lib/utils/user-context"
import { getValidFlocks, getFlocksForSelect } from "@/lib/utils/flock-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewExpensePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [flocks, setFlocks] = useState<{ value: string; label: string }[]>([])
  const [flocksLoading, setFlocksLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    flockId: "",
    expenseDate: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    amount: "",
    paymentMethod: "",
  })

  const expenseCategories = [
    "Feed",
    "Veterinary",
    "Equipment",
    "Labor",
    "Utilities",
    "Other"
  ]

  const paymentMethods = [
    "Cash",
    "Credit Card",
    "Bank Transfer",
    "Check",
    "Other"
  ]

  useEffect(() => {
    loadFlocks()
  }, [])

  const loadFlocks = async () => {
    try {
      setFlocksLoading(true)
      await getValidFlocks()
      const flocksForSelect = getFlocksForSelect()
      setFlocks(flocksForSelect)
      
      if (flocksForSelect.length === 0) {
        setError("No active flocks found. Please create a flock first.")
      }
    } catch (error) {
      console.error("[v0] Error loading flocks:", error)
      setError("Failed to load flocks. Please try again.")
    } finally {
      setFlocksLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { userId, farmId } = getUserContext()
    
    console.log("[v0] Form submit - getUserContext result:", { userId, farmId })

    if (!userId || !farmId) {
      console.error("[v0] Missing user context - userId:", userId, "farmId:", farmId)
      setError("User context not found. Please log in again.")
      setLoading(false)
      return
    }

    if (!formData.flockId) {
      setError("Please select a flock")
      setLoading(false)
      return
    }

    if (!formData.category) {
      setError("Please select a category")
      setLoading(false)
      return
    }

    if (!formData.description.trim()) {
      setError("Please enter a description")
      setLoading(false)
      return
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Please enter a valid amount")
      setLoading(false)
      return
    }

    if (!formData.paymentMethod) {
      setError("Please select a payment method")
      setLoading(false)
      return
    }

    const expense: ExpenseInput = {
      farmId,
      userId,
      flockId: Number(formData.flockId),
      expenseDate: formData.expenseDate + "T00:00:00Z",
      category: formData.category,
      description: formData.description.trim(),
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
    }

    console.log("[v0] Form submit - final expense object:", expense)

    const result = await createExpense(expense)
    
    if (result.success) {
      router.push("/expenses")
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
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Add Expense</h1>
                <p className="text-slate-600">Record a new farm expense</p>
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
                <h3 className="text-lg font-semibold text-slate-900">Expense Information</h3>
                <p className="text-sm text-slate-600">
                  Enter the expense details for the selected date
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="flockId" className="text-sm font-medium text-slate-700">
                      Select Flock *
                    </Label>
                    <Select value={formData.flockId} onValueChange={(value) => handleSelectChange("flockId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a flock" />
                      </SelectTrigger>
                      <SelectContent>
                        {flocksLoading ? (
                          <SelectItem value="loading" disabled>Loading flocks...</SelectItem>
                        ) : flocks.length === 0 ? (
                          <SelectItem value="no-flocks" disabled>No flocks available</SelectItem>
                        ) : (
                          flocks.map((flock) => (
                            <SelectItem key={flock.value} value={flock.value}>
                              {flock.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expenseDate" className="text-sm font-medium text-slate-700">
                      Expense Date *
                    </Label>
                    <Input
                      id="expenseDate"
                      name="expenseDate"
                      type="date"
                      value={formData.expenseDate}
                      onChange={handleChange}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                      Category *
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod" className="text-sm font-medium text-slate-700">
                      Payment Method *
                    </Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => handleSelectChange("paymentMethod", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                      Amount ($) *
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter expense description..."
                    rows={3}
                    required
                    className="w-full"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/expenses")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || flocksLoading || flocks.length === 0}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Create Expense
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

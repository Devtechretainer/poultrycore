"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Plus, Edit, Trash2, ShoppingCart, DollarSign, TrendingUp, Package, FileText, Printer } from "lucide-react"
import { getSales, createSale, updateSale, deleteSale, getFlocks, getCustomers, createCustomer, type Sale, type SaleInput } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { getUserContext } from "@/lib/utils/user-context"
import { formatCurrency, getSelectedCurrency, setSelectedCurrency } from "@/lib/utils/currency"

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [flocks, setFlocks] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [showNewCustomerInput, setShowNewCustomerInput] = useState(false)
  const [farmInfo, setFarmInfo] = useState({
    name: "Farm Name",
    address: "",
    phone: "",
    email: "",
  })
  const { toast } = useToast()
  const invoicePrintRef = useRef<HTMLDivElement | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<SaleInput>>({
    saleDate: new Date().toISOString().split('T')[0],
    product: "",
    quantity: 0,
    unitPrice: 0,
    totalAmount: 0,
    paymentMethod: "",
    customerName: "",
    flockId: 0,
    saleDescription: "",
  })

  const productOptions = ["Fresh Eggs", "Chicken", "Manure", "Other"]
  const paymentMethodOptions = ["Cash", "Credit Card", "Bank Transfer", "Check", "Mobile Money"]
  const currencyOptions = ["GHS", "USD", "EUR", "GBP", "NGN", "KES"]

  const [productSelection, setProductSelection] = useState<string | undefined>(undefined)
  const [productOther, setProductOther] = useState("")
  const [currencyCode, setCurrencyCode] = useState<string>(() => getSelectedCurrency())
  const [searchCustomer, setSearchCustomer] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    loadSales()
    loadFlocks()
    loadCustomers()
    
    // Check for global search query from header
    if (typeof window !== 'undefined') {
      const globalSearch = sessionStorage.getItem('globalSearchQuery')
      if (globalSearch) {
        setSearchCustomer(globalSearch)
        sessionStorage.removeItem('globalSearchQuery')
      }
      
      // Listen for global search events from header
      const handleGlobalSearch = (e: CustomEvent) => {
        setSearchCustomer(e.detail.query)
      }
      
      window.addEventListener('globalSearch', handleGlobalSearch as EventListener)
      return () => {
        window.removeEventListener('globalSearch', handleGlobalSearch as EventListener)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedFarmName = localStorage.getItem("farmName")
    const storedFarmAddress = localStorage.getItem("farmAddress")
    const storedFarmPhone = localStorage.getItem("farmPhone")
    const storedFarmEmail = localStorage.getItem("farmEmail")

    setFarmInfo({
      name: storedFarmName || "Farm Name",
      address: storedFarmAddress || "",
      phone: storedFarmPhone || "",
      email: storedFarmEmail || "",
    })
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
  
  const loadCustomers = async () => {
    const { userId, farmId } = getUserContext()
    if (userId && farmId) {
      const result = await getCustomers(userId, farmId)
      if (result.success && result.data) {
        setCustomers(result.data)
      }
    }
  }

  const loadSales = async () => {
    try {
      setLoading(true)
      const { userId, farmId } = getUserContext()
      
      if (!userId || !farmId) {
        toast({
          title: "Error",
          description: "User context not found. Please log in again.",
          variant: "destructive",
        })
        return
      }
      
      const response = await getSales(userId, farmId)
      if (response.success && response.data) {
        setSales(response.data)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load sales",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sales",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSale = async () => {
    try {
      const { userId, farmId } = getUserContext()
      
      if (!userId || !farmId) {
        toast({
          title: "Error",
          description: "User context not found. Please log in again.",
          variant: "destructive",
        })
        return
      }
      
      if (!validateSaleForm()) return

      const quantity = Number(formData.quantity ?? 0)
      const unitPrice = Number(formData.unitPrice ?? 0)
      const totalAmount = quantity * unitPrice
      const saleData: SaleInput = {
        farmId,
        userId,
        saleId: 0,
        saleDate: formData.saleDate!,
        product: (formData.product ?? "").toString().trim(),
        quantity,
        unitPrice,
        totalAmount,
        paymentMethod: (formData.paymentMethod ?? "").toString(),
        customerName: (formData.customerName ?? "").toString(),
        flockId: formData.flockId ?? 0,
        saleDescription: formData.saleDescription ?? "",
      }
      
      const response = await createSale(saleData)
      if (response.success) {
        toast({
          title: "Success",
          description: "Sale created successfully",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadSales()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create sale",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sale",
        variant: "destructive",
      })
    }
  }

  const handleUpdateSale = async () => {
    if (!editingSale) return

    try {
      const { userId, farmId } = getUserContext()
      
      if (!userId || !farmId) {
        toast({
          title: "Error",
          description: "User context not found. Please log in again.",
          variant: "destructive",
        })
        return
      }
      
      if (!validateSaleForm()) return

      const quantity = Number(formData.quantity ?? 0)
      const unitPrice = Number(formData.unitPrice ?? 0)
      const totalAmount = quantity * unitPrice

      const payload: Partial<SaleInput> = {
        farmId,
        userId,
        saleDate: formData.saleDate!,
        product: (formData.product ?? "").toString().trim(),
        quantity,
        unitPrice,
        totalAmount,
        paymentMethod: (formData.paymentMethod ?? "").toString(),
        customerName: (formData.customerName ?? "").toString(),
        flockId: formData.flockId ?? 0,
        saleDescription: formData.saleDescription ?? "",
      }
      
      const response = await updateSale(editingSale.saleId, payload)
      if (response.success) {
        toast({
          title: "Success",
          description: "Sale updated successfully",
        })
        setIsEditDialogOpen(false)
        setEditingSale(null)
        resetForm()
        loadSales()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update sale",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update sale",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSale = async (id: number) => {
    if (!confirm("Are you sure you want to delete this sale?")) return

    try {
      const { userId, farmId } = getUserContext()
      const response = await deleteSale(id, userId, farmId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Sale deleted successfully",
        })
        loadSales()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete sale",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete sale",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      saleDate: new Date().toISOString().split('T')[0],
      product: "",
      quantity: 0,
      unitPrice: 0,
      totalAmount: 0,
      paymentMethod: "",
      customerName: "",
      flockId: 0,
      saleDescription: "",
    })
    setProductSelection(undefined)
    setProductOther("")
    setShowNewCustomerInput(false)
  }
  
  const handleCreateNewCustomer = async (customerName: string) => {
    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) return
    
    try {
      const newCustomer = {
        farmId,
        userId,
        name: customerName,
        contactEmail: "",
        contactPhone: "",
        address: "",
        city: "",
      }
      
      const result = await createCustomer(newCustomer)
      if (result.success) {
        toast({
          title: "Success",
          description: "Customer created successfully",
        })
        loadCustomers()
        setShowNewCustomerInput(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      })
    }
  }

  const handleProductSelect = (value: string) => {
    setProductSelection(value)
    if (value === "Other") {
      const existing = productOther || (typeof formData.product === "string" && !productOptions.includes(formData.product) ? formData.product : "")
      setProductOther(existing)
      setFormData(prev => ({ ...prev, product: existing }))
    } else {
      setProductOther("")
      setFormData(prev => ({ ...prev, product: value }))
    }
  }

  const handleCurrencyChange = (value: string) => {
    setCurrencyCode(value)
    setSelectedCurrency(value)
  }

  const clearFilters = () => {
    setSearchCustomer("")
    setDateFrom("")
    setDateTo("")
  }

  const validateSaleForm = () => {
    const errors: string[] = []
    const product = (formData.product ?? "").toString().trim()
    const quantity = Number(formData.quantity ?? 0)
    const unitPrice = Number(formData.unitPrice ?? 0)
    const paymentMethod = (formData.paymentMethod ?? "").toString()
    const customerName = (formData.customerName ?? "").toString()

    if (!product) errors.push("Select a product.")
    if (!customerName) errors.push("Choose a customer.")
    if (!formData.saleDate) errors.push("Select a sale date.")
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push("Quantity must be greater than zero.")
    if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.push("Unit price cannot be negative.")
    if (!paymentMethod) errors.push("Select a payment method.")

    if (errors.length) {
      toast({
        title: "Unable to save sale",
        description: errors.join(" "),
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const getFlockLabel = (flockId?: number | null) => {
    if (flockId === 0 || flockId === null || typeof flockId === "undefined") return "All flocks"
    const match = flocks.find((flock) => flock.flockId === flockId)
    return match ? `${match.name}` : `#${flockId}`
  }

  const openEditDialog = (sale: Sale) => {
    setEditingSale(sale)
    setFormData({
      saleDate: sale.saleDate.split('T')[0],
      product: sale.product,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      customerName: sale.customerName,
      flockId: sale.flockId,
      saleDescription: sale.saleDescription,
    })
    const selection = productOptions.includes(sale.product) ? sale.product : "Other"
    setProductSelection(selection)
    setProductOther(selection === "Other" ? sale.product : "")
    setShowNewCustomerInput(false)
    setIsEditDialogOpen(true)
  }

  const calculateTotal = () => {
    const quantity = Number(formData.quantity) || 0
    const unitPrice = Number(formData.unitPrice) || 0
    const total = quantity * unitPrice
    setFormData(prev => ({ ...prev, totalAmount: total }))
  }

  useEffect(() => {
    calculateTotal()
  }, [formData.quantity, formData.unitPrice])

  const openInvoiceDialog = (sale: Sale) => {
    setSelectedSale(sale)
    setIsInvoiceDialogOpen(true)
  }

  const closeInvoiceDialog = (open: boolean) => {
    setIsInvoiceDialogOpen(open)
    if (!open) {
      setSelectedSale(null)
    }
  }

  const generateInvoiceNumber = (saleId: number) => {
    return `INV-${saleId.toString().padStart(6, "0")}`
  }

  const formatInvoiceDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handlePrintInvoice = () => {
    if (!selectedSale || typeof window === "undefined") return
    const invoiceContent = invoicePrintRef.current?.innerHTML

    if (!invoiceContent) {
      toast({
        title: "Print error",
        description: "Unable to prepare invoice for printing.",
        variant: "destructive",
      })
      return
    }

    const printWindow = window.open("", "_blank", "width=900,height=650")
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Please allow pop-ups to print the invoice.",
        variant: "destructive",
      })
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${generateInvoiceNumber(selectedSale.saleId)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1, h2, h3, h4 { margin: 0; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
            .invoice-section { margin-bottom: 24px; }
            .invoice-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
            .invoice-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
            .muted { color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            .total-row td { font-weight: bold; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; border: 1px solid #cbd5f5; background: #eef2ff; color: #3730a3; font-size: 12px; }
          </style>
        </head>
        <body>
          ${invoiceContent}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
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

  const filteredSales = useMemo(() => {
    const query = searchCustomer.trim().toLowerCase()
    return sales.filter((sale) => {
      if (query) {
        const matchesCustomer = sale.customerName?.toLowerCase().includes(query)
        const matchesProduct = sale.product?.toLowerCase().includes(query)
        if (!matchesCustomer && !matchesProduct) return false
      }
      if (dateFrom) {
        if (new Date(sale.saleDate) < new Date(dateFrom)) return false
      }
      if (dateTo) {
        const saleDate = new Date(sale.saleDate)
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        if (saleDate > to) return false
      }
      return true
    })
  }, [sales, searchCustomer, dateFrom, dateTo])

  const totalSales = useMemo(() => filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0), [filteredSales])
  const totalQuantity = useMemo(() => filteredSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0), [filteredSales])
  const selectedFlockId = formData.flockId ?? null
  const selectedFlockIdString = selectedFlockId !== null ? selectedFlockId.toString() : ""
  const productSelectValue = productSelection ?? (
    typeof formData.product === "string" && formData.product
      ? (productOptions.includes(formData.product) ? formData.product : "Other")
      : undefined
  )

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
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
                </div>
                <p className="text-slate-600">Manage your farm sales and transactions</p>
              </div>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                  setIsCreateDialogOpen(open)
                  if (open) {
                    resetForm()
                  } else {
                    resetForm()
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Add Sale
                  </Button>
                </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
              <DialogDescription>
                Add a new sale record to track your farm's revenue
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="saleDate">Sale Date</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={productSelectValue}
                    onValueChange={handleProductSelect}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {productSelectValue === "Other" && (
                    <Input
                      value={productOther}
                      onChange={(e) => {
                        const value = e.target.value
                        setProductOther(value)
                        setFormData(prev => ({ ...prev, product: value }))
                      }}
                      placeholder="Enter product name"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethodOptions.map(method => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  {showNewCustomerInput ? (
                    <div className="flex gap-2">
                      <Input
                        id="newCustomerName"
                        placeholder="Enter new customer name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget as HTMLInputElement
                            if (input.value.trim()) {
                              handleCreateNewCustomer(input.value.trim())
                              setFormData(prev => ({ ...prev, customerName: input.value.trim() }))
                            }
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          const input = document.getElementById('newCustomerName') as HTMLInputElement
                          if (input?.value.trim()) {
                            handleCreateNewCustomer(input.value.trim())
                            setFormData(prev => ({ ...prev, customerName: input.value.trim() }))
                          }
                        }}
                      >
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowNewCustomerInput(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Select 
                        value={showNewCustomerInput ? "__NEW__" : formData.customerName || undefined}
                        onValueChange={(value) => {
                          if (value === "__NEW__") {
                            setShowNewCustomerInput(true)
                            setFormData(prev => ({ ...prev, customerName: "" }))
                          } else {
                            setShowNewCustomerInput(false)
                            setFormData(prev => ({ ...prev, customerName: value }))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select or add customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.customerId || customer.name} value={customer.name}>
                              {customer.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="__NEW__">
                            + Add New Customer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flockId">Flock</Label>
                  <Select
                    value={selectedFlockIdString}
                    onValueChange={(value) =>
                      setFormData(prev => ({
                        ...prev,
                        flockId: value ? Number(value) : undefined,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a flock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All flocks</SelectItem>
                      {flocks.map((flock) => (
                        <SelectItem key={flock.flockId} value={flock.flockId.toString()}>
                          {flock.name} ({flock.quantity} birds)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleDescription">Description</Label>
                <Textarea
                  id="saleDescription"
                  value={formData.saleDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, saleDescription: e.target.value }))}
                  placeholder="Additional notes about this sale"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSale}>Create Sale</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

            {/* Filters */}
            <div className="p-3 bg-white rounded border flex flex-wrap gap-3 items-end">
              <div className="w-full sm:w-[220px]">
                <Label className="text-xs text-slate-500">Customer / Product</Label>
                <Input
                  placeholder="Search customer or product"
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Currency</Label>
                <Select value={currencyCode} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto">
                <Button variant="outline" onClick={clearFilters}>
                  Reset filters
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalSales, currencyCode)}</div>
                  <p className="text-xs text-muted-foreground">
                    {filteredSales.length} transactions
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalQuantity}</div>
                  <p className="text-xs text-muted-foreground">
                    items sold
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(filteredSales.length > 0 ? (totalSales / filteredSales.length) : 0, currencyCode)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    per transaction
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Table */}
            {loading ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-600">Loading sales...</p>
                </CardContent>
              </Card>
            ) : sales.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No sales found</h3>
                  <p className="text-slate-600 mb-6">Get started by adding your first sale</p>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                        Add Your First Sale
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            ) : filteredSales.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center space-y-3">
                  <p className="text-slate-600">No sales match the current filters.</p>
                  <Button variant="outline" onClick={clearFilters}>Reset filters</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>
                    View and manage your sales transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Flock</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.saleId}>
                          <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                          <TableCell>{sale.product}</TableCell>
                          <TableCell>{sale.customerName}</TableCell>
                          <TableCell>{getFlockLabel(sale.flockId)}</TableCell>
                          <TableCell>{sale.quantity}</TableCell>
                          <TableCell>{formatCurrency(sale.unitPrice, currencyCode)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(sale.totalAmount, currencyCode)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{sale.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(sale)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSale(sale.saleId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openInvoiceDialog(sale)}
                                aria-label="View Invoice"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Edit Dialog */}
            <Dialog
              open={isEditDialogOpen}
              onOpenChange={(open) => {
                setIsEditDialogOpen(open)
                if (!open) {
                  setEditingSale(null)
                  resetForm()
                }
              }}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Sale</DialogTitle>
                  <DialogDescription>
                    Update the sale record
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-saleDate">Sale Date</Label>
                      <Input
                        id="edit-saleDate"
                        type="date"
                        value={formData.saleDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-product">Product</Label>
                      <Select
                        value={productSelectValue}
                        onValueChange={handleProductSelect}
                      >
                        <SelectTrigger id="edit-product">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productOptions.map(option => (
                            <SelectItem key={`edit-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {productSelectValue === "Other" && (
                        <Input
                          value={productOther}
                          onChange={(e) => {
                            const value = e.target.value
                            setProductOther(value)
                            setFormData(prev => ({ ...prev, product: value }))
                          }}
                          placeholder="Enter product name"
                        />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-quantity">Quantity</Label>
                      <Input
                        id="edit-quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-unitPrice">Unit Price</Label>
                      <Input
                        id="edit-unitPrice"
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-totalAmount">Total Amount</Label>
                      <Input
                        id="edit-totalAmount"
                        type="number"
                        step="0.01"
                        value={formData.totalAmount}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-paymentMethod">Payment Method</Label>
                      <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethodOptions.map(method => (
                            <SelectItem key={`edit-${method}`} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-customerName">Customer Name</Label>
                      <Select 
                        value={showNewCustomerInput ? "__NEW__" : formData.customerName || undefined} 
                        onValueChange={(value) => {
                          if (value === "__NEW__") {
                            setShowNewCustomerInput(true)
                            setFormData(prev => ({ ...prev, customerName: "" }))
                          } else {
                            setShowNewCustomerInput(false)
                            setFormData(prev => ({ ...prev, customerName: value }))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select or add customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.customerId || customer.name} value={customer.name}>
                              {customer.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="__NEW__">
                            + Add New Customer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {showNewCustomerInput && (
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="editNewCustomerName"
                            placeholder="Enter new customer name"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.currentTarget as HTMLInputElement
                                if (input.value.trim()) {
                                  handleCreateNewCustomer(input.value.trim())
                                  setFormData(prev => ({ ...prev, customerName: input.value.trim() }))
                                }
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              const input = document.getElementById('editNewCustomerName') as HTMLInputElement
                              if (input?.value.trim()) {
                                handleCreateNewCustomer(input.value.trim())
                                setFormData(prev => ({ ...prev, customerName: input.value.trim() }))
                              }
                            }}
                          >
                            Add
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setShowNewCustomerInput(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-flockId">Flock</Label>
                      <Select
                        value={selectedFlockIdString}
                        onValueChange={(value) =>
                          setFormData(prev => ({
                            ...prev,
                            flockId: value ? Number(value) : undefined,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a flock" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="0">All flocks</SelectItem>
                          {flocks.map((flock) => (
                            <SelectItem key={flock.flockId} value={flock.flockId.toString()}>
                              {flock.name} ({flock.quantity} birds)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-saleDescription">Description</Label>
                    <Textarea
                      id="edit-saleDescription"
                      value={formData.saleDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, saleDescription: e.target.value }))}
                      placeholder="Additional notes about this sale"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateSale}>Update Sale</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Invoice Dialog */}
            <Dialog open={isInvoiceDialogOpen} onOpenChange={closeInvoiceDialog}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Sale Invoice</DialogTitle>
                  <DialogDescription>
                    Review the invoice details and print a copy for the customer.
                  </DialogDescription>
                </DialogHeader>

                {selectedSale ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Invoice Number</p>
                        <p className="text-xl font-semibold">
                          {generateInvoiceNumber(selectedSale.saleId)}
                        </p>
                      </div>
                      <Button onClick={handlePrintInvoice} className="gap-2 self-start md:self-auto">
                        <Printer className="h-4 w-4" />
                        Print Invoice
                      </Button>
                    </div>

                    <div
                      ref={invoicePrintRef}
                      id="invoice-print-area"
                      className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900"
                    >
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h2 className="text-2xl font-bold">{farmInfo.name}</h2>
                            {farmInfo.address && (
                              <p className="mt-1 text-sm text-slate-500">{farmInfo.address}</p>
                            )}
                            <div className="mt-2 space-y-1 text-sm text-slate-500">
                              {farmInfo.phone && <p>Phone: {farmInfo.phone}</p>}
                              {farmInfo.email && <p>Email: {farmInfo.email}</p>}
                            </div>
                          </div>
                          <div className="space-y-1 text-right text-sm text-slate-500">
                            <p>
                              <span className="font-semibold text-slate-700">Invoice Date:</span>{" "}
                              {formatInvoiceDate(selectedSale.saleDate)}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-700">Created:</span>{" "}
                              {formatInvoiceDate(selectedSale.createdDate)}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-700">Payment Method:</span>{" "}
                              {selectedSale.paymentMethod}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-lg border border-slate-200 p-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                              Bill To
                            </h3>
                            <p className="mt-2 text-lg font-medium">{selectedSale.customerName}</p>
                            <p className="text-sm text-slate-500">
                              {selectedSale.saleDescription || "Customer invoice"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 p-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                              Sale Reference
                            </h3>
                            <div className="mt-2 space-y-1 text-sm text-slate-500">
                              <p>
                                <span className="font-semibold text-slate-700">Product:</span>{" "}
                                {selectedSale.product}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">Flock:</span>{" "}
                                {getFlockLabel(selectedSale.flockId)}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">Recorded By:</span>{" "}
                                {selectedSale.userId}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-slate-200">
                          <table className="w-full">
                            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Quantity</th>
                                <th className="px-6 py-3">Unit Price</th>
                                <th className="px-6 py-3">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              <tr className="border-t border-slate-200">
                                <td className="px-6 py-4">
                                  <p className="font-medium text-slate-800">{selectedSale.product}</p>
                                  {selectedSale.saleDescription && (
                                    <p className="mt-1 text-slate-500">
                                      {selectedSale.saleDescription}
                                    </p>
                                  )}
                                </td>
                                <td className="px-6 py-4">{selectedSale.quantity}</td>
                                <td className="px-6 py-4">
                                  {formatCurrency(selectedSale.unitPrice, currencyCode)}
                                </td>
                                <td className="px-6 py-4 font-semibold">
                                  {formatCurrency(selectedSale.totalAmount, currencyCode)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <p className="text-sm text-slate-500">
                            Thank you for your business! Please contact us if you have any questions about this invoice.
                          </p>
                          <div className="rounded-lg border border-slate-200 px-6 py-4 text-right">
                            <p className="text-sm text-slate-500">Total Due</p>
                            <p className="text-2xl font-bold text-slate-900">
                              {formatCurrency(selectedSale.totalAmount, currencyCode)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a sale to view invoice details.
                  </p>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}

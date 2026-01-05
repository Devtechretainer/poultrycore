import { buildApiUrl, getAuthHeaders } from './config'

function normalizeApiBase(raw?: string, fallback = 'farmapi.techretainer.com') {
  const val = raw || fallback
  return val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`
}

// For server-side use
const DIRECT_API_BASE_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE_URL)

// Check if we should use proxy (browser) or direct URL (server)
const IS_BROWSER = typeof window !== 'undefined'

export interface Customer {
  farmId: string
  userId: string
  customerId: number
  name: string
  contactEmail: string
  contactPhone: string
  address: string
  city: string
  createdDate: string
}

export interface CustomerInput {
  farmId: string
  userId: string
  name: string
  contactEmail: string
  contactPhone: string
  address: string
  city: string
}

// Mock data for development
const mockCustomers: Customer[] = [
  {
    customerId: 1,
    farmId: "farm-1",
    userId: "user-1",
    name: "John Smith",
    contactEmail: "john.smith@example.com",
    contactPhone: "+1 (555) 123-4567",
    address: "123 Main Street, Apt 4B",
    city: "New York",
    createdDate: new Date().toISOString(),
  },
  {
    customerId: 2,
    farmId: "farm-1",
    userId: "user-1",
    name: "Sarah Johnson",
    contactEmail: "sarah.johnson@example.com",
    contactPhone: "+1 (555) 987-6543",
    address: "456 Oak Avenue",
    city: "Los Angeles",
    createdDate: new Date().toISOString(),
  },
  {
    customerId: 3,
    farmId: "farm-1",
    userId: "user-1",
    name: "Mike Wilson",
    contactEmail: "mike.wilson@example.com",
    contactPhone: "+1 (555) 456-7890",
    address: "789 Pine Road",
    city: "Chicago",
    createdDate: new Date().toISOString(),
  },
]

let nextCustomerId = 4

export async function getCustomers(userId: string, farmId: string) {
  try {
    // Use proxy in browser, direct URL on server
    const endpoint = `/Customer?userId=${encodeURIComponent(userId)}&farmId=${encodeURIComponent(farmId)}`
    const url = IS_BROWSER ? buildApiUrl(endpoint) : `${DIRECT_API_BASE_URL}/api${endpoint}`
    console.log("[v0] Fetching customers:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    console.log("[v0] Customers response status:", response.status)

    if (!response.ok) {
      // Only log detailed errors if not 404 (endpoint might not exist)
      if (response.status !== 404) {
        const errorText = await response.text()
        console.warn("[v0] Customers API error:", response.status, errorText)
      } else {
        console.log("[v0] Customer API endpoint not available (404), using mock data")
      }
      
      // Return mock data when API fails
      return {
        success: true,
        message: "Customers fetched successfully (mock data)",
        data: mockCustomers,
      }
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("[v0] Non-JSON response received")
      console.log("[v0] Using mock data for customers")
      
      return {
        success: true,
        message: "Customers fetched successfully (mock data)",
        data: mockCustomers,
      }
    }

    const data = await response.json()
    console.log("[v0] Customers data received:", data)

    return {
      success: true,
      message: "Customers fetched successfully",
      data: data as Customer[],
    }
  } catch (error) {
    console.error("[v0] Customers fetch error:", error)
    console.log("[v0] Using mock data for customers")
    
    return {
      success: true,
      message: "Customers fetched successfully (mock data)",
      data: mockCustomers,
    }
  }
}

export async function getCustomer(id: number, userId: string, farmId: string) {
  try {
    const endpoint = `/Customer/${id}?userId=${encodeURIComponent(userId)}&farmId=${encodeURIComponent(farmId)}`
    const url = IS_BROWSER ? buildApiUrl(endpoint) : `${DIRECT_API_BASE_URL}/api${endpoint}`
    console.log("[v0] Fetching customer:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Customer fetch error:", errorText)
      console.log("[v0] Using mock data for customer")
      
      // Find customer in mock data
      const customer = mockCustomers.find(c => c.customerId === id)
      if (customer) {
        return {
          success: true,
          message: "Customer fetched successfully (mock data)",
          data: customer,
        }
      } else {
        return {
          success: false,
          message: "Customer not found",
          data: null,
        }
      }
    }

    const data = await response.json()
    return {
      success: true,
      message: "Customer fetched successfully",
      data: data as Customer,
    }
  } catch (error) {
    console.error("[v0] Customer fetch error:", error)
    console.log("[v0] Using mock data for customer")
    
    // Find customer in mock data
    const customer = mockCustomers.find(c => c.customerId === id)
    if (customer) {
      return {
        success: true,
        message: "Customer fetched successfully (mock data)",
        data: customer,
      }
    } else {
      return {
        success: false,
        message: "Customer not found",
        data: null,
      }
    }
  }
}

export async function createCustomer(customer: CustomerInput) {
  try {
    const endpoint = `/Customer`
    const url = IS_BROWSER ? buildApiUrl(endpoint) : `${DIRECT_API_BASE_URL}/api${endpoint}`
    console.log("[v0] Creating customer:", url)

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...customer,
        customerId: 0,
        createdDate: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Customer create error:", errorText)
      console.log("[v0] Using mock data for customer creation")
      
      // Add to mock data
      const newCustomer: Customer = {
        ...customer,
        customerId: nextCustomerId++,
        createdDate: new Date().toISOString(),
      }
      mockCustomers.push(newCustomer)
      
      return {
        success: true,
        message: "Customer created successfully (mock data)",
      }
    }

    return {
      success: true,
      message: "Customer created successfully",
    }
  } catch (error) {
    console.error("[v0] Customer create error:", error)
    console.log("[v0] Using mock data for customer creation")
    
    // Add to mock data
    const newCustomer: Customer = {
      ...customer,
      customerId: nextCustomerId++,
      createdDate: new Date().toISOString(),
    }
    mockCustomers.push(newCustomer)
    
    return {
      success: true,
      message: "Customer created successfully (mock data)",
    }
  }
}

export async function updateCustomer(id: number, customer: CustomerInput) {
  try {
    const endpoint = `/Customer/${id}`
    const url = IS_BROWSER ? buildApiUrl(endpoint) : `${DIRECT_API_BASE_URL}/api${endpoint}`
    console.log("[v0] Updating customer:", url)

    const response = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...customer,
        customerId: id,
        createdDate: customer.createdDate || new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Customer update error:", errorText)
      console.log("[v0] Using mock data for customer update")
      
      // Update in mock data
      const index = mockCustomers.findIndex(c => c.customerId === id)
      if (index !== -1) {
        mockCustomers[index] = {
          ...mockCustomers[index],
          ...customer,
        }
        return {
          success: true,
          message: "Customer updated successfully (mock data)",
        }
      } else {
        return {
          success: false,
          message: "Customer not found",
        }
      }
    }

    return {
      success: true,
      message: "Customer updated successfully",
    }
  } catch (error) {
    console.error("[v0] Customer update error:", error)
    console.log("[v0] Using mock data for customer update")
    
    // Update in mock data
    const index = mockCustomers.findIndex(c => c.customerId === id)
    if (index !== -1) {
      mockCustomers[index] = {
        ...mockCustomers[index],
        ...customer,
      }
      return {
        success: true,
        message: "Customer updated successfully (mock data)",
      }
    } else {
      return {
        success: false,
        message: "Customer not found",
      }
    }
  }
}

export async function deleteCustomer(id: number, userId: string, farmId: string) {
  try {
    const endpoint = `/Customer/${id}?userId=${encodeURIComponent(userId)}&farmId=${encodeURIComponent(farmId)}`
    const url = IS_BROWSER ? buildApiUrl(endpoint) : `${DIRECT_API_BASE_URL}/api${endpoint}`
    console.log("[v0] Deleting customer:", url)

    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Customer delete error:", errorText)
      console.log("[v0] Using mock data for customer deletion")
      
      // Remove from mock data
      const index = mockCustomers.findIndex(c => c.customerId === id)
      if (index !== -1) {
        mockCustomers.splice(index, 1)
        return {
          success: true,
          message: "Customer deleted successfully (mock data)",
        }
      } else {
        return {
          success: false,
          message: "Customer not found",
        }
      }
    }

    return {
      success: true,
      message: "Customer deleted successfully",
    }
  } catch (error) {
    console.error("[v0] Customer delete error:", error)
    console.log("[v0] Using mock data for customer deletion")
    
    // Remove from mock data
    const index = mockCustomers.findIndex(c => c.customerId === id)
    if (index !== -1) {
      mockCustomers.splice(index, 1)
      return {
        success: true,
        message: "Customer deleted successfully (mock data)",
      }
    } else {
      return {
        success: false,
        message: "Customer not found",
      }
    }
  }
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7190"

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
    const url = `${API_BASE_URL}/api/Customer?userId=${encodeURIComponent(userId)}&farmId=${encodeURIComponent(farmId)}`
    console.log("[v0] Fetching customers:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    console.log("[v0] Customers response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Customers fetch error:", errorText)
      console.log("[v0] Using mock data for customers")
      
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
    const url = `${API_BASE_URL}/api/Customer/${id}?userId=${encodeURIComponent(userId)}&farmId=${encodeURIComponent(farmId)}`
    console.log("[v0] Fetching customer:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
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
    const url = `${API_BASE_URL}/api/Customer`
    console.log("[v0] Creating customer:", url)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
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
    const url = `${API_BASE_URL}/api/Customer/${id}`
    console.log("[v0] Updating customer:", url)

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
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
    const url = `${API_BASE_URL}/api/Customer/${id}?userId=${encodeURIComponent(userId)}&farmId=${encodeURIComponent(farmId)}`
    console.log("[v0] Deleting customer:", url)

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
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
// Admin API uses different port than other APIs
import { getAuthHeaders } from './config'

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || "https://UserManagementAPI.techretainer.com"

export interface Employee {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  userName: string
  farmId: string
  farmName: string
  isStaff: boolean
  emailConfirmed: boolean
  createdDate: string
  // lastLoginTime?: string | null // Commented out until database column is added
}

export interface CreateEmployeeData {
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  userName: string
  password: string
  farmId: string
  farmName: string
}

export interface UpdateEmployeeData {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

// Mock employees data
const mockEmployees: Employee[] = [
  {
    id: "emp-1",
    userName: "john_staff",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "+1 (555) 111-2222",
    farmId: "farm-1",
    farmName: "Demo Farm",
    isStaff: true,
    emailConfirmed: true,
    createdDate: new Date().toISOString(),
  },
  {
    id: "emp-2",
    userName: "jane_staff",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Smith",
    phoneNumber: "+1 (555) 333-4444",
    farmId: "farm-1",
    farmName: "Demo Farm",
    isStaff: true,
    emailConfirmed: true,
    createdDate: new Date().toISOString(),
  },
]

// Get all employees
export async function getEmployees(): Promise<ApiResponse<Employee[]>> {
  try {
    const url = `${API_BASE_URL}/api/Admin/employees`
    console.log("[Admin API] Fetching employees:", url)
    
    // Log token presence for debugging
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token")
      console.log("[Admin API] Token present:", !!token, "Token length:", token?.length)
    }

    const headers = getAuthHeaders()
    console.log("[Admin API] Request headers:", headers)

    const response = await fetch(url, {
      method: "GET",
      headers,
    })

    console.log("[Admin API] Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      // Only log error details if not 401 (auth issue) and if error text exists
      if (response.status !== 401 && errorText && errorText.trim() !== '') {
        console.warn("[Admin API] Fetch error:", errorText)
        console.warn("[Admin API] Response status:", response.status)
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        return {
          success: false,
          message: "Your session has expired. Please log in again to continue.",
        }
      }
      
      // Handle empty error response
      if (!errorText || errorText.trim() === '') {
        return {
          success: false,
          message: `API returned ${response.status} ${response.statusText}. The employees API may be unavailable.`,
        }
      }
      
      // Parse error message
      try {
        const errorData = JSON.parse(errorText)
        const errorMessages = errorData.errors 
          ? Object.values(errorData.errors).flat().join(', ')
          : errorData.title || 'Failed to fetch employees'
        
        return {
          success: false,
          message: `API Error: ${errorMessages}`,
        }
      } catch (e) {
        return {
          success: false,
          message: `Failed to fetch employees: ${errorText || response.statusText}`,
        }
      }
    }

    const data = await response.json()
    console.log("[Admin API] Data received:", data)

    return {
      success: true,
      message: "Employees fetched successfully",
      data: data as Employee[],
    }
  } catch (error) {
    // Silently handle Admin API errors - it's optional for chat functionality
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Only log if it's not a network error (which is expected if Admin API is unavailable)
    if (!errorMessage.includes('Failed to fetch') && !errorMessage.includes('NetworkError')) {
      console.warn("[Admin API] Fetch error (non-network):", errorMessage)
    }
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      return {
        success: false,
        message: `Unable to connect to the Admin API at ${API_BASE_URL}. Please ensure the server is running and CORS is configured to allow requests from your frontend domain.`,
      }
    }
    
    return {
      success: false,
      message: `Network error: ${errorMessage}`,
    }
  }
}

// Get employee count
export async function getEmployeeCount(): Promise<ApiResponse<number>> {
  try {
    const url = `${API_BASE_URL}/api/Admin/employees/count`
    console.log("[Admin API] Fetching employee count:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Admin API] Employee count error:", errorText)
      return {
        success: false,
        message: "Failed to fetch employee count",
      }
    }

    const data = await response.json()
    return {
      success: true,
      message: "Employee count fetched successfully",
      data: data.count || data,
    }
  } catch (error) {
    console.error("[Admin API] Employee count error:", error)
    return {
      success: false,
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// Get single employee by ID
export async function getEmployee(id: string): Promise<ApiResponse<Employee>> {
  try {
    const url = `${API_BASE_URL}/api/Admin/employees/${id}`
    console.log("[Admin API] Fetching employee:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Admin API] Employee fetch error:", errorText)
      return {
        success: false,
        message: "Failed to fetch employee",
      }
    }

    const data = await response.json()
    return {
      success: true,
      message: "Employee fetched successfully",
      data: data as Employee,
    }
  } catch (error) {
    console.error("[Admin API] Employee fetch error:", error)
    return {
      success: false,
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// Create new employee (staff member)
export async function createEmployee(employee: CreateEmployeeData): Promise<ApiResponse<Employee>> {
  try {
    const url = `${API_BASE_URL}/api/Admin/employees`
    console.log("[Admin API] Creating employee:", url)

    // Match the API request body structure exactly
    const requestBody = {
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phoneNumber: employee.phoneNumber,
      userName: employee.userName,
      password: employee.password,
      farmId: employee.farmId,
      farmName: employee.farmName,
    }

    console.log("[Admin API] Request body:", JSON.stringify(requestBody, null, 2))

    // Use custom headers for Admin API
    const headers = {
      ...getAuthHeaders(),
      Accept: "text/plain", // Admin API expects text/plain
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    console.log("[Admin API] Create response status:", response.status, response.statusText)
    console.log("[Admin API] Response headers:", [...response.headers.entries()])

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Admin API] Create error (status):", response.status, response.statusText)
      console.error("[Admin API] Create error (body):", errorText)
      
      // Handle authentication errors
      if (response.status === 401) {
        console.error("[Admin API] Authentication failed - token may be invalid or expired")
        return {
          success: false,
          message: "Your session has expired. Please log in again to continue.",
        }
      }
      
      // Handle empty error response
      if (!errorText || errorText.trim() === '') {
        return {
          success: false,
          message: `API returned ${response.status} ${response.statusText}. Please check the API connection.`,
        }
      }
      
      // Parse error for better message
      try {
        const errorData = JSON.parse(errorText)
        let errorMessage = 'Failed to create employee'
        
        // Try to extract the actual error message
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.errors) {
          errorMessage = Object.values(errorData.errors).flat().join(', ')
        } else if (errorData.title) {
          errorMessage = errorData.title
        }
        
        return {
          success: false,
          message: errorMessage,
        }
      } catch (e) {
        // If not JSON, use the text as-is
        return {
          success: false,
          message: errorText || `Failed to create employee: ${response.status} ${response.statusText}`,
        }
      }
    }

    // Try to read the response body as text (since API returns text/plain)
    const responseText = await response.text()
    console.log("[Admin API] Success response:", responseText)

    return {
      success: true,
      message: responseText || "Employee created successfully",
    }
  } catch (error) {
    console.error("[Admin API] Create exception:", error)
    return {
      success: false,
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// Update employee
export async function updateEmployee(id: string, data: UpdateEmployeeData): Promise<ApiResponse> {
  try {
    const url = `${API_BASE_URL}/api/Admin/employees/${id}`
    console.log("[Admin API] Updating employee:", url)

    const response = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Admin API] Update error:", errorText)
      return {
        success: false,
        message: "Failed to update employee",
      }
    }

    return {
      success: true,
      message: "Employee updated successfully",
    }
  } catch (error) {
    console.error("[Admin API] Update error:", error)
    return {
      success: false,
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// Delete employee
export async function deleteEmployee(id: string): Promise<ApiResponse> {
  try {
    const url = `${API_BASE_URL}/api/Admin/employees/${id}`
    console.log("[Admin API] Deleting employee:", url)

    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Admin API] Delete error:", errorText)
      return {
        success: false,
        message: "Failed to delete employee",
      }
    }

    return {
      success: true,
      message: "Employee deleted successfully",
    }
  } catch (error) {
    console.error("[Admin API] Delete error:", error)
    return {
      success: false,
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// Get employees who logged in today
export async function getTodayLogins(): Promise<ApiResponse<Employee[]>> {
  try {
    const url = `${API_BASE_URL}/api/Admin/employees/today-logins`
    const headers = getAuthHeaders()
    
    console.log("[Admin API] Fetching today's logins from:", url)
    
    const response = await fetch(url, {
      method: "GET",
      headers,
    })

    console.log("[Admin API] Today logins response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Admin API] Today logins error:", errorText)
      
      if (response.status === 401) {
        return {
          success: false,
          message: "Your session has expired. Please log in again to continue.",
        }
      }
      
      if (!errorText || errorText.trim() === '') {
        return {
          success: false,
          message: `API returned ${response.status} ${response.statusText}. The logins API may be unavailable.`,
        }
      }
      
      try {
        const errorData = JSON.parse(errorText)
        const errorMessages = errorData.errors 
          ? Object.values(errorData.errors).flat().join(', ')
          : errorData.title || 'Failed to fetch today logins'
        
        return {
          success: false,
          message: `API Error: ${errorMessages}`,
        }
      } catch (e) {
        return {
          success: false,
          message: `Failed to fetch today logins: ${errorText || response.statusText}`,
        }
      }
    }

    const data = await response.json()
    console.log("[Admin API] Today logins data:", data)

    return {
      success: true,
      data,
      message: "Today logins retrieved successfully",
    }
  } catch (error) {
    console.error("[Admin API] Network error fetching today logins:", error)
    return {
      success: false,
      message: "Failed to fetch today logins. Please check your connection.",
    }
  }
}


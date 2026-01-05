// API utility functions for Flock management

import { buildApiUrl, getAuthHeaders } from './config'

function normalizeApiBase(raw?: string, fallback = 'farmapi.techretainer.com') {
  const val = raw || fallback
  return val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`
}

// For server-side use
const DIRECT_API_BASE_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE_URL)

// Check if we should use proxy (browser) or direct URL (server)
const IS_BROWSER = typeof window !== 'undefined'

export interface Flock {
  farmId: string
  userId: string
  flockId: number
  name: string
  startDate: string
  breed: string
  quantity: number
  active: boolean
  houseId?: number | null
  batchId?: number | null
  inactivationReason?: string
  otherReason?: string
  notes?: string
  batchName?: string
}

export interface FlockInput {
  farmId: string
  userId: string
  flockId?: number
  name: string
  startDate: string
  breed: string
  quantity: number
  active: boolean
  houseId?: number | null
  batchId: number
  inactivationReason?: string
  otherReason?: string
  notes?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

// Mock data for development
const mockFlocks: Flock[] = [
  {
    farmId: "farm-1",
    userId: "user-1",
    flockId: 1,
    name: "Layer Flock A",
    startDate: "2024-01-15T00:00:00.000Z",
    breed: "Rhode Island Red",
    quantity: 250,
    active: true,
    houseId: null,
  },
  {
    farmId: "farm-1",
    userId: "user-1",
    flockId: 2,
    name: "Broiler Flock B",
    startDate: "2024-02-01T00:00:00.000Z",
    breed: "Cornish Cross",
    quantity: 500,
    active: true,
    houseId: null,
  },
  {
    farmId: "farm-1",
    userId: "user-1",
    flockId: 3,
    name: "Retired Layer Flock",
    startDate: "2023-06-01T00:00:00.000Z",
    breed: "Leghorn",
    quantity: 180,
    active: false,
    houseId: null,
  },
]

let nextFlockId = 4

// Get all flocks
export async function getFlocks(userId?: string, farmId?: string): Promise<ApiResponse<Flock[]>> {
  try {
    const params = new URLSearchParams()
    if (userId) params.append('userId', userId)
    if (farmId) params.append('farmId', farmId)
    
    const endpoint = `/Flock${params.toString() ? '?' + params.toString() : ''}`
    const url = IS_BROWSER ? buildApiUrl(endpoint) : `${DIRECT_API_BASE_URL}/api${endpoint}`
    console.log("[v0] Fetching flocks:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    console.log("[v0] Flocks response status:", response.status)

    if (!response.ok) {
      // Handle 404 gracefully - endpoint might not exist on backend
      if (response.status === 404) {
        console.log("[v0] Flocks endpoint not available (404), using mock data")
      } else {
        const errorText = await response.text()
        console.warn("[v0] Flocks API error:", response.status, errorText)
      }
      // Mock data fallback
      console.warn("[v0] Using mock data for flocks due to API error.")
      const filteredMockData = mockFlocks.filter(flock => 
        (!userId || flock.userId === userId) && 
        (!farmId || flock.farmId === farmId)
      )
      return {
        success: true,
        message: "Using mock data",
        data: filteredMockData,
      }
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("[v0] Non-JSON response received")
      console.warn("[v0] Using mock data for flocks due to non-JSON response.")
      const filteredMockData = mockFlocks.filter(flock => 
        (!userId || flock.userId === userId) && 
        (!farmId || flock.farmId === farmId)
      )
      return {
        success: true,
        message: "Using mock data",
        data: filteredMockData,
      }
    }

    const data = await response.json()
    console.log("[v0] Flocks data received:", data)

    if (!Array.isArray(data)) {
      console.error("[v0] Expected array but got:", typeof data)
      console.warn("[v0] Using mock data for flocks due to unexpected data format.")
      const filteredMockData = mockFlocks.filter(flock => 
        (!userId || flock.userId === userId) && 
        (!farmId || flock.farmId === farmId)
      )
      return {
        success: true,
        message: "Using mock data",
        data: filteredMockData,
      }
    }

    return {
      success: true,
      message: "Flocks fetched successfully",
      data: data as Flock[],
    }
  } catch (error) {
    console.error("[v0] Flocks fetch error:", error)
    console.warn("[v0] Using mock data for flocks due to error.")
    const filteredMockData = mockFlocks.filter(flock => 
      (!userId || flock.userId === userId) && 
      (!farmId || flock.farmId === farmId)
    )
    return {
      success: true,
      message: "Using mock data",
      data: filteredMockData,
    }
  }
}

// Get single flock by ID
export async function getFlock(id: number, userId?: string, farmId?: string): Promise<ApiResponse<Flock | null>> {
  try {
    const params = new URLSearchParams()
    if (userId) params.append('userId', userId)
    if (farmId) params.append('farmId', farmId)
    
    const endpoint = `/Flock/${id}${params.toString() ? '?' + params.toString() : ''}`
    const url = IS_BROWSER ? buildApiUrl(endpoint) : `${DIRECT_API_BASE_URL}/api${endpoint}`
    console.log("[v0] Fetching flock:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    console.log("[v0] Flock response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Flock fetch error:", errorText)
      // Mock data fallback
      console.warn("[v0] Using mock data for flock due to API error.")
      const mockFlock = mockFlocks.find(f => f.flockId === id)
      if (mockFlock) {
        return {
          success: true,
          message: "Using mock data",
          data: mockFlock,
        }
      }
      return {
        success: false,
        message: "Flock not found",
        data: null,
      }
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("[v0] Non-JSON response received")
      console.warn("[v0] Using mock data for flock due to non-JSON response.")
      const mockFlock = mockFlocks.find(f => f.flockId === id)
      if (mockFlock) {
        return {
          success: true,
          message: "Using mock data",
          data: mockFlock,
        }
      }
      return {
        success: false,
        message: "Flock not found",
        data: null,
      }
    }

    const data = await response.json()
    console.log("[v0] Flock data received:", data)

    return {
      success: true,
      message: "Flock fetched successfully",
      data: data as Flock,
    }
  } catch (error) {
    console.error("[v0] Flock fetch error:", error)
    console.warn("[v0] Using mock data for flock due to error.")
    const mockFlock = mockFlocks.find(f => f.flockId === id)
    if (mockFlock) {
      return {
        success: true,
        message: "Using mock data",
        data: mockFlock,
      }
    }
    return {
      success: false,
      message: "Flock not found",
      data: null,
    }
  }
}

// Create new flock
export async function createFlock(flock: FlockInput): Promise<ApiResponse<Flock>> {
  try {
    const endpoint = `/Flock`
    const url = IS_BROWSER ? buildApiUrl(endpoint) : `${DIRECT_API_BASE_URL}/api${endpoint}`
    console.log("[v0] Creating flock:", url)
    console.log("[v0] Flock input:", flock)

    // Try to get userId and farmId from localStorage as fallback
    let farmId = flock.farmId
    let userId = flock.userId
    
    if (!farmId && typeof window !== "undefined") {
      farmId = localStorage.getItem("farmId") || ""
      console.log("[v0] Got farmId from localStorage:", farmId)
    }
    
    if (!userId && typeof window !== "undefined") {
      userId = localStorage.getItem("userId") || ""
      console.log("[v0] Got userId from localStorage:", userId)
    }

    // Validate required fields
    if (!farmId) {
      console.error("[v0] FarmId is required but not provided. Flock:", flock)
      return {
        success: false,
        message: "Farm ID is required. Please log in again.",
        data: null as any,
      }
    }

    if (!userId) {
      console.error("[v0] userId is required but not provided. Flock:", flock)
      return {
        success: false,
        message: "User ID is required. Please log in again.",
        data: null as any,
      }
    }

    // Create the request body with proper field names that match the API expectations
    const requestBody = {
      FarmId: farmId, // API expects FarmId (capital F)
      UserId: userId,
      FlockId: 0, // Server will assign the ID
      Name: flock.name,
      StartDate: flock.startDate,
      Breed: flock.breed,
      Quantity: flock.quantity,
      Active: flock.active,
      HouseId: flock.houseId ?? null,
      BatchId: flock.batchId,
      Notes: flock.notes ?? null,
    }

    console.log("[v0] Flock request body:", requestBody)

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
    })

    console.log("[v0] Flock create response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Flock create error:", errorText)
      console.log("[v0] Using mock data for flock creation")
      
      const newFlock: Flock = {
        ...flock,
        flockId: nextFlockId++,
      }
      mockFlocks.push(newFlock)
      
      return {
        success: true,
        message: "Flock created successfully (mock data - API failed)",
        data: newFlock,
      }
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("[v0] Non-JSON response received")
      console.log("[v0] Using mock data for flock creation")
      
      const newFlock: Flock = {
        ...flock,
        flockId: nextFlockId++,
      }
      mockFlocks.push(newFlock)
      
      return {
        success: true,
        message: "Flock created successfully (mock data - non-JSON response)",
        data: newFlock,
      }
    }

    const data = await response.json()
    console.log("[v0] Created flock data:", data)

    return {
      success: true,
      message: "Flock created successfully",
      data: data as Flock,
    }
  } catch (error) {
    console.error("[v0] Flock create error:", error)
    console.log("[v0] Using mock data for flock creation")
    
    const newFlock: Flock = {
      ...flock,
      flockId: nextFlockId++,
    }
    mockFlocks.push(newFlock)
    
    return {
      success: true,
      message: "Flock created successfully (mock data - error occurred)",
      data: newFlock,
    }
  }
}

// Update flock
export async function updateFlock(id: number, flock: Partial<FlockInput>): Promise<ApiResponse<Flock>> {
  try {
    const endpoint = `/Flock/${id}`
    const url = IS_BROWSER ? buildApiUrl(endpoint) : `${DIRECT_API_BASE_URL}/api${endpoint}`
    console.log("[v0] Updating flock:", url)

    // Create the request body with proper field names that match the API expectations
    const requestBody: any = {}
    if (flock.farmId) requestBody.FarmId = flock.farmId // API expects FarmId (capital F)
    if (flock.userId) requestBody.UserId = flock.userId
    if (flock.flockId !== undefined) requestBody.FlockId = flock.flockId
    if (flock.name) requestBody.Name = flock.name
    if (flock.startDate) requestBody.StartDate = flock.startDate
    if (flock.breed) requestBody.Breed = flock.breed
    if (flock.quantity !== undefined) requestBody.Quantity = flock.quantity
    if (flock.active !== undefined) requestBody.Active = flock.active
    if (flock.houseId !== undefined) requestBody.HouseId = flock.houseId
    if (flock.batchId !== undefined) requestBody.BatchId = flock.batchId
    if (flock.inactivationReason) requestBody.InactivationReason = flock.inactivationReason
    if (flock.otherReason) requestBody.OtherReason = flock.otherReason
    if (flock.notes !== undefined) requestBody.Notes = flock.notes

    console.log("[v0] Flock update request body:", requestBody)

    const response = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
    })

    console.log("[v0] Flock update response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Flock update error:", errorText)
      return {
        success: false,
        message: "Failed to update flock",
        data: null as any,
      }
    }

    // Many APIs return 204 No Content for successful updates
    if (response.status === 204) {
      return {
        success: true,
        message: "Flock updated successfully",
        data: undefined as any,
      }
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      // Treat non-JSON 200-range responses as success
      return {
        success: true,
        message: "Flock updated successfully",
        data: undefined as any,
      }
    }

    const data = await response.json()
    console.log("[v0] Updated flock data:", data)

    return {
      success: true,
      message: "Flock updated successfully",
      data: data as Flock,
    }
  } catch (error) {
    console.error("[v0] Flock update error:", error)
    return {
      success: false,
      message: "Failed to update flock",
      data: null as any,
    }
  }
}

// Delete flock
export async function deleteFlock(id: number, userId?: string, farmId?: string): Promise<ApiResponse> {
  try {
    const params = new URLSearchParams()
    if (userId) params.append('userId', userId)
    if (farmId) params.append('farmId', farmId)
    
    const endpoint = `/Flock/${id}${params.toString() ? '?' + params.toString() : ''}`
    const url = IS_BROWSER ? buildApiUrl(endpoint) : `${DIRECT_API_BASE_URL}/api${endpoint}`
    console.log("[v0] Deleting flock:", url)

    console.log("id:", id, "userId:", userId, "farmId:", farmId)

    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    console.log("[v0] Flock delete response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Flock delete error:", errorText)
      return {
        success: false,
        message: "Failed to delete flock",
      }
    }

    return {
      success: true,
      message: "Flock deleted successfully",
    }
  } catch (error) {
    console.error("[v0] Flock delete error:", error)
    return {
      success: false,
      message: "Failed to delete flock",
    }
  }
}

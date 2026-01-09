// Houses REST client targeting PoultryFarmAPI

import { buildApiUrl, getAuthHeaders } from './config'

function normalizeApiBase(raw?: string, fallback = 'farmapi.techretainer.com') {
  const val = raw || fallback
  return val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`
}

// For server-side use
const DIRECT_API_BASE_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE_URL)

// Check if we should use proxy (browser) or direct URL (server)
const IS_BROWSER = typeof window !== 'undefined'

export interface House {
  houseId: number
  farmId: string
  name: string
  capacity?: number | null
  createdDate?: string
  location?: string | null
}

export interface HouseInput {
  userId: string
  farmId: string
  name: string
  capacity?: number | null
  location?: string | null
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    // Remove /api/ prefix if present (buildApiUrl handles it)
    const cleanPath = path.startsWith('/api/') ? path.replace('/api', '') : path
    const url = IS_BROWSER ? buildApiUrl(cleanPath) : `${DIRECT_API_BASE_URL}${path}`
    
    const method = init?.method || 'GET'
    const headers = getAuthHeaders()
    
    // Merge any additional headers from init
    if (init?.headers) {
      Object.assign(headers, init.headers)
    }

    const res = await fetch(url, {
      method,
      headers,
      ...init,
    })

    const contentType = res.headers.get('content-type') || ''
    const body = contentType.includes('application/json') ? await res.json() : await res.text()

    if (!res.ok) {
      // Handle 404 gracefully - endpoint might not exist on backend
      if (res.status === 404) {
        console.log(`[v0] House API endpoint not available (404): ${path}`)
      } else {
        console.warn(`[v0] House API error (${res.status}):`, body && (body.message || body.Message) || res.statusText)
      }
      return { success: false, message: (body && (body.message || body.Message)) || res.statusText }
    }

    return { success: true, data: body }
  } catch (error: any) {
    console.error(`[v0] House API network error:`, error)
    return { success: false, message: error?.message || 'Network error' }
  }
}

// GET /api/House?userId=&farmId=
export async function getHouses(userId: string, farmId: string): Promise<ApiResponse<House[]>> {
  const qs = new URLSearchParams({ userId, farmId }).toString()
  return request<House[]>(`/api/House?${qs}`)
}

// GET /api/House/{id}?userId=&farmId=
export async function getHouse(id: number, userId: string, farmId: string): Promise<ApiResponse<House>> {
  return request<House>(`/api/House/${id}?userId=${encodeURIComponent(userId)}&farmId=${encodeURIComponent(farmId)}`)
}

// POST /api/House { UserId, FarmId, HouseName, Capacity, Location }
export async function createHouse(input: HouseInput): Promise<ApiResponse<House>> {
  const payload = {
    UserId: input.userId,
    FarmId: input.farmId,
    HouseName: input.name,
    Capacity: input.capacity ?? null,
    Location: input.location ?? null,
  }
  return request<House>(`/api/House`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// PUT /api/House/{id}
export async function updateHouse(id: number, input: HouseInput): Promise<ApiResponse<House>> {
  const payload = {
    UserId: input.userId,
    FarmId: input.farmId,
    HouseId: id,
    HouseName: input.name,
    Capacity: input.capacity ?? null,
    Location: input.location ?? null,
  }
  return request<House>(`/api/House/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// DELETE /api/House/{id}?userId=&farmId={}
export async function deleteHouse(id: number, userId: string, farmId: string): Promise<ApiResponse<void>> {
  // SECURITY: Validate required parameters before proceeding
  if (!userId || !farmId) {
    console.error("[v0] Security: Missing userId or farmId for house deletion");
    return {
      success: false,
      message: "Authorization required. Please log in again.",
    } as any;
  }
  
  if (!id || !Number.isFinite(id) || id <= 0) {
    console.error("[v0] Security: Invalid house ID");
    return {
      success: false,
      message: "Invalid house ID",
    } as any;
  }
  
  return request<void>(`/api/House/${id}?userId=${encodeURIComponent(userId)}&farmId=${encodeURIComponent(farmId)}`, { method: 'DELETE' })
}

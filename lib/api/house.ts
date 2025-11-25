// Houses REST client targeting PoultryFarmAPI

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7190"

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
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
      mode: 'cors',
      ...init,
    })

    const contentType = res.headers.get('content-type') || ''
    const body = contentType.includes('application/json') ? await res.json() : await res.text()

    if (!res.ok) {
      return { success: false, message: (body && (body.message || body.Message)) || res.statusText }
    }

    return { success: true, data: body }
  } catch (error: any) {
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
  return request<void>(`/api/House/${id}?userId=${encodeURIComponent(userId)}&farmId=${encodeURIComponent(farmId)}`, { method: 'DELETE' })
}

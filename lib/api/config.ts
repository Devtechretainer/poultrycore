// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://FarmAPI.techretainer.com"

// Log the configuration on load (only in browser)
if (typeof window !== "undefined") {
  console.log("[v0] API Configuration:")
  console.log("[v0] - Base URL:", API_BASE_URL)
  console.log("[v0] - Environment variable:", process.env.NEXT_PUBLIC_API_BASE_URL)
}

export { API_BASE_URL }

export function getApiUrl(path: string): string {
  const url = `${API_BASE_URL}${path}`
  console.log("[v0] Constructed API URL:", url)
  return url
}

// Helper function to get user context for API calls
export function getUserContext(): { farmId: string; userId: string } {
  if (typeof window === "undefined") {
    return { farmId: "", userId: "" }
  }

  const farmId = localStorage.getItem("farmId") || ""
  const userId = localStorage.getItem("userId") || ""

  return { farmId, userId }
}

// Helper function to get auth headers
export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token")
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

// Helper function to validate required context
export function validateUserContext(): { isValid: boolean; farmId: string; userId: string } {
  const { farmId, userId } = getUserContext()
  
  if (!farmId || !userId) {
    console.error("[v0] Missing required user context - farmId:", farmId, "userId:", userId)
    return { isValid: false, farmId, userId }
  }
  
  return { isValid: true, farmId, userId }
}

// Helper function to fetch with timeout
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 5000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if ((error as Error).name === 'AbortError') {
      console.warn(`[v0] Request timed out after ${timeout}ms:`, url)
    }
    throw error
  }
}

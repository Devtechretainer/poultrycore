// API utility functions for authentication 

// Use Admin API URL for authentication endpoints
// For local development with ngrok, you may need to:
// 1. Run the backend locally and set NEXT_PUBLIC_ADMIN_API_URL to http://localhost:PORT
// 2. Or update the production backend CORS to allow your ngrok domain
// Example: NEXT_PUBLIC_ADMIN_API_URL=http://localhost:7010
const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || "https://usermanagementapi.poultrycore.com"

export interface RegisterData {
  farmName: string
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  roles: string[]
  phoneNumber: string
}

export interface LoginData {
  username: string
  password: string
  rememberMe: boolean
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  email: string
  password: string
  confirmPassword: string
  token: string
}

export interface ConfirmEmailData {
  email: string
  token: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

// Register new user
export async function register(data: RegisterData): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Authentication/register`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Registration failed",
        errors: result.errors,
      }
    }

    return {
      success: true,
      data: result,
      message: "Registration successful",
    }
  } catch (error) {
    return {
      success: false,
      message: "Network error. Please try again.",
    }
  }
}

// Login user
export async function login(data: LoginData): Promise<ApiResponse> {
  try {
    console.log("[Poultry Core] Login request:", { username: data.username, apiUrl: API_BASE_URL })

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/api/Authentication/login`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Handle specific fetch errors
      if (fetchError.name === 'AbortError') {
        console.error("[Poultry Core] Request timeout:", API_BASE_URL)
        return {
          success: false,
          message: `Request timed out. The server at ${API_BASE_URL} is not responding. Please check if the API is running and accessible.`,
        }
      }
      
      // Network errors (CORS, connection refused, etc.)
      console.error("[Poultry Core] Fetch error:", fetchError)
      console.error("[Poultry Core] Error details:", {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
      })
      
      // Provide specific error messages
      let errorMessage = `Unable to connect to the server at ${API_BASE_URL}. `
      
      if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
        errorMessage += "This could be due to:\n"
        errorMessage += "1. The backend API is not running\n"
        errorMessage += "2. CORS configuration issue on the backend\n"
        errorMessage += "3. Network connectivity problem\n"
        errorMessage += "4. SSL certificate issue (if using HTTPS)\n"
        errorMessage += `\nPlease verify that ${API_BASE_URL} is accessible and the API is running.`
      } else {
        errorMessage += fetchError.message || "Network error. Please try again."
      }
      
      return {
        success: false,
        message: errorMessage,
      }
    }

    // Check if response is actually JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.error("[Poultry Core] Non-JSON response:", {
        status: response.status,
        statusText: response.statusText,
        contentType,
        body: text.substring(0, 500) // First 500 chars
      })
      return {
        success: false,
        message: `Server returned non-JSON response (${response.status} ${response.statusText}). Please check if the API is running at ${API_BASE_URL}`,
      }
    }

    // Check if response body is empty
    const text = await response.text()
    if (!text || text.trim().length === 0) {
      console.error("[Poultry Core] Empty response from server")
      return {
        success: false,
        message: `Server returned empty response (${response.status} ${response.statusText}). Please check if the API is running at ${API_BASE_URL}`,
      }
    }

    // Parse JSON
    let result
    try {
      result = JSON.parse(text)
    } catch (parseError) {
      console.error("[Poultry Core] JSON parse error:", parseError)
      console.error("[Poultry Core] Response text:", text.substring(0, 500))
      return {
        success: false,
        message: `Invalid JSON response from server. Please check if the API is running correctly at ${API_BASE_URL}`,
      }
    }

    console.log("[Poultry Core] Full login response:", JSON.stringify(result, null, 2))
    console.log("[Poultry Core] Requires 2FA:", result.RequiresTwoFactor || result.requiresTwoFactor)
    console.log("[Poultry Core] Is Success:", result.isSuccess)
    console.log("[Poultry Core] Response keys:", Object.keys(result))

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Login failed",
        errors: result.errors,
      }
    }

    // Check if 2FA is required (check before processing success response)
    const requires2FA = result.RequiresTwoFactor || result.requiresTwoFactor
    console.log("[Poultry Core] Checking 2FA requirement:", { requires2FA, result })
    
    if (requires2FA === true) {
      console.log("[Poultry Core] 2FA required, redirecting to 2FA page")
      return {
        success: true,
        data: {
          requiresTwoFactor: true,
          userId: result.userId || result.UserId,
          userName: result.username || result.userName || result.userName,
          message: result.message || result.Message || "OTP sent to your email"
        },
        message: result.message || result.Message || "OTP sent to your email",
      }
    }
    
    console.log("[Poultry Core] No 2FA required, processing normal login")

    // Handle the response structure from your API
    if (result.isSuccess && result.response) {
      const userData = result.response

      // Store access token
      if (userData.accessToken?.token) {
        localStorage.setItem("auth_token", userData.accessToken.token)
        console.log("[Poultry Core] Stored auth token")
        
        // Also sync with apiClient if it exists
        if (typeof window !== 'undefined') {
          try {
            const { apiClient } = await import('@/lib/api/client')
            apiClient.setToken(userData.accessToken.token)
            console.log("[Poultry Core] Synced token with apiClient")
          } catch (err) {
            console.log("[Poultry Core] Could not sync with apiClient:", err)
          }
        }
      }

      // Store refresh token
      if (userData.refreshToken?.token) {
        localStorage.setItem("refresh_token", userData.refreshToken.token)
        console.log("[Poultry Core] Stored refresh token")
      }

      // Store user ID
      if (userData.userId) {
        localStorage.setItem("userId", userData.userId)
        console.log("[Poultry Core] Stored userId:", userData.userId)
      }

      // Store username
      if (userData.username) {
        localStorage.setItem("username", userData.username)
        console.log("[Poultry Core] Stored username:", userData.username)
      }

      // Store farm ID
      if (userData.farmId) {
        localStorage.setItem("farmId", userData.farmId)
        console.log("[v0] Stored farmId:", userData.farmId)
      } else if (userData.userId) {
        // Fallback: If farmId is not returned, use userId as farmId
        localStorage.setItem("farmId", userData.userId)
        console.log("[v0] FarmId not in response, using userId as farmId:", userData.userId)
      }

      // Store farm name
      if (userData.farmName) {
        localStorage.setItem("farmName", userData.farmName)
        console.log("[v0] Stored farmName:", userData.farmName)
      } else {
        // Fallback farm name
        localStorage.setItem("farmName", "My Farm")
        console.log("[v0] FarmName not in response, using default: My Farm")
      }

      // Store user roles
      if (userData.roles && Array.isArray(userData.roles)) {
        localStorage.setItem("roles", JSON.stringify(userData.roles))
        console.log("[v0] Stored roles:", userData.roles)
      } else {
        // Default to Admin role if not specified
        localStorage.setItem("roles", JSON.stringify(["Admin"]))
        console.log("[v0] No roles in response, defaulting to Admin")
      }

      // Store user flags
      localStorage.setItem("isStaff", String(userData.isStaff || false))
      localStorage.setItem("isSubscriber", String(userData.isSubscriber || false))
      
      console.log("[v0] Login complete - stored all user data")
    }

    return {
      success: result.isSuccess || true,
      data: result,
      message: result.message || "Login successful",
    }
  } catch (error: any) {
    console.error("[Poultry Core] Login error:", error)
    console.error("[Poultry Core] Error type:", error?.constructor?.name)
    console.error("[Poultry Core] Error message:", error?.message)
    
    // Provide more specific error messages based on the error type
    let errorMessage = "Network error. Please try again."
    
    if (error instanceof TypeError) {
      if (error.message === "Failed to fetch" || error.message.includes("Failed to fetch")) {
        errorMessage = `Unable to connect to the server at ${API_BASE_URL}.\n\nPossible causes:\n`
        errorMessage += `• The backend API is not running\n`
        errorMessage += `• CORS configuration issue - the backend needs to allow requests from ${typeof window !== 'undefined' ? window.location.origin : 'your frontend'}\n`
        errorMessage += `• Network connectivity problem\n`
        errorMessage += `• SSL certificate issue (if using HTTPS)\n\n`
        errorMessage += `Please verify that ${API_BASE_URL} is accessible.`
      } else if (error.message.includes("CORS")) {
        errorMessage = `CORS error: The backend at ${API_BASE_URL} is not allowing requests from this origin. Please check the CORS configuration on the backend.`
      } else if (error.message.includes("NetworkError")) {
        errorMessage = "Network connection failed. Please check your internet connection."
      } else {
        errorMessage = `Network error: ${error.message || "Unknown error occurred"}`
      }
    } else if (error?.name === "AbortError") {
      errorMessage = `Request timed out. The server at ${API_BASE_URL} is not responding.`
    } else {
      errorMessage = error?.message || "An unexpected error occurred. Please try again."
    }
    
    return {
      success: false,
      message: errorMessage,
    }
  }
}

// Forgot password - send OTP
export async function forgotPassword(data: ForgotPasswordData): Promise<ApiResponse> {
  try {
    console.log("[Auth API] Forgot password request:", { email: data.email, apiUrl: API_BASE_URL })

    const response = await fetch(`${API_BASE_URL}/api/Authentication/ForgotPassword`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: data.email }),
    })

    console.log("[Auth API] Forgot password response status:", response.status)

    // Check if response is JSON
    const contentType = response.headers.get("content-type")
    const responseText = await response.text()
    
    // Backend returns 200 OK even if user doesn't exist (security)
    if (!response.ok) {
      console.error("[Auth API] Forgot password error:", responseText)
      
      try {
        const result = contentType?.includes("application/json") ? JSON.parse(responseText) : null
        if (result) {
          return {
            success: false,
            message: result.message || "Failed to send reset code",
            errors: result.errors,
          }
        }
      } catch {
        // Not JSON, return generic error
      }
      return {
        success: false,
        message: responseText || "Failed to send reset code. Please try again.",
      }
    }

    // Success response
    return {
      success: true,
      message: "If this email exists, a reset code has been sent to your inbox.",
    }
  } catch (error) {
    console.error("[Auth API] Forgot password exception:", error)
    return {
      success: false,
      message: "Network error. Please check if the API is running on " + API_BASE_URL,
    }
  }
}

// Reset password
export async function resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
  try {
    console.log("[Auth API] Reset password request:", { 
      email: data.email, 
      hasToken: !!data.token,
      apiUrl: API_BASE_URL 
    })

    const response = await fetch(`${API_BASE_URL}/api/Authentication/ResetPassword`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        token: data.token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }),
    })

    console.log("[Auth API] Reset password response status:", response.status)

    const contentType = response.headers.get("content-type")
    const responseText = await response.text()

    if (!response.ok) {
      console.error("[Auth API] Reset password error:", responseText)
      
      try {
        const result = contentType?.includes("application/json") ? JSON.parse(responseText) : null
        if (!result) {
          return {
            success: false,
            message: responseText || "Password reset failed. Please try again.",
          }
        }
        
        // Extract validation errors if present
        let errorMessage = "Password reset failed"
        if (result.errors) {
          const errorMessages = Object.values(result.errors).flat()
          errorMessage = errorMessages.join(', ')
        } else if (result.message) {
          errorMessage = result.message
        }
        
        return {
          success: false,
          message: errorMessage,
          errors: result.errors,
        }
      } catch {
        return {
          success: false,
          message: "Invalid reset code or password. Please try again.",
        }
      }
    }

    // Success
    return {
      success: true,
      message: "Password reset successful! You can now login with your new password.",
    }
  } catch (error) {
    console.error("[Auth API] Reset password exception:", error)
    return {
      success: false,
      message: "Network error. Please check if the API is running on " + API_BASE_URL,
    }
  }
}

// Confirm email
export async function confirmEmail(data: ConfirmEmailData): Promise<ApiResponse> {
  try {
    console.log("[Auth API] Confirm email request:", { email: data.email, hasToken: !!data.token })

    const url = `${API_BASE_URL}/api/Authentication/ConfirmEmail?email=${encodeURIComponent(data.email)}&token=${encodeURIComponent(data.token)}`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "*/*",
      },
    })

    console.log("[Auth API] Confirm email response status:", response.status)

    const contentType = response.headers.get("content-type")
    const responseText = await response.text()

    if (!response.ok) {
      console.error("[Auth API] Confirm email error:", responseText)
      
      try {
        const result = contentType?.includes("application/json") ? JSON.parse(responseText) : null
        if (result) {
          return {
            success: false,
            message: result.message || "Email confirmation failed",
            errors: result.errors,
          }
        }
      } catch {
        // Not JSON
      }
      return {
        success: false,
        message: responseText || "Email confirmation failed. The link may be invalid or expired.",
      }
    }

    let result
    try {
      result = contentType?.includes("application/json") ? JSON.parse(responseText) : null
      if (!result) {
        return {
          success: false,
          message: "Invalid response from server. Please try again.",
        }
      }
    } catch (parseError) {
      console.error("[Auth API] JSON parse error:", parseError)
      return {
        success: false,
        message: "Invalid response from server. Please try again.",
      }
    }
    return {
      success: true,
      data: result,
      message: result.message || "Email confirmed successfully! You can now login.",
    }
  } catch (error) {
    console.error("[Auth API] Confirm email exception:", error)
    return {
      success: false,
      message: "Network error. Please check if the API is running on " + API_BASE_URL,
    }
  }
}

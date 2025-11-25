import { apiClient } from '@/lib/api/client'

interface LoginCredentials {
  username: string
  password: string
}

interface Login2FACredentials {
  userId: string
  userName: string
  otpCode: string
}

interface RegisterData {
  username: string
  email: string
  password: string
  phoneNumber?: string
  farmName?: string
}

interface AuthResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    username: string
    email: string
    farmId: string
    farmName: string
    isStaff: boolean
    isSubscriber: boolean
    firstName?: string
    lastName?: string
    phone?: string
    phoneNumber?: string
    customerId?: string
    lastLoginTime?: string
  }
}

export class AuthService {
  /**
   * Login with username and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/Authentication/login', credentials)
  }

  /**
   * Login with 2FA (after initial login)
   */
  static async login2FA(credentials: Login2FACredentials): Promise<AuthResponse> {
    // Use Login API base URL directly to avoid baseURL mismatches
    const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://localhost:7010'
    const res = await fetch(`${baseUrl}/api/Authentication/login-2FA`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: '*/*' },
      // Backend model binder accepts PascalCase; send both to be safe
      body: JSON.stringify({
        userId: credentials.userId,
        userName: credentials.userName,
        otpCode: credentials.otpCode,
        UserId: credentials.userId,
        UserName: credentials.userName,
        OtpCode: credentials.otpCode,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Invalid OTP code')
    }

    const data = (await res.json()) as any

    // Normalize and return AuthResponse while also syncing tokens to apiClient/localStorage
    const token = data?.response?.accessToken?.token || data?.accessToken?.token || data?.token
    const refreshToken = data?.response?.refreshToken?.token || data?.refreshToken?.token || data?.refreshToken
    const user = data?.response?.user || data?.user || {
      id: data?.userId,
      username: data?.username || credentials.userName,
      email: data?.email || '',
      farmId: data?.farmId || data?.userId,
      farmName: data?.farmName || '',
      isStaff: !!data?.isStaff,
      isSubscriber: !!data?.isSubscriber,
    }

    if (typeof window !== 'undefined' && token) {
      localStorage.setItem('auth_token', token)
      try { (await import('@/lib/api/client')).apiClient.setToken(token) } catch {}
    }

    return { token, refreshToken, user } as AuthResponse
  }

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/Authentication/register', data)
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    return apiClient.post<{ token: string; refreshToken: string }>('/api/Authentication/refresh-token', {
      refreshToken,
    })
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(): Promise<AuthResponse['user']> {
    return apiClient.get<AuthResponse['user']>('/api/Authentication/get-current-user')
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    return apiClient.post('/api/Authentication/logout', {})
  }

  /**
   * Request password reset
   */
  static async forgotPassword(email: string): Promise<void> {
    return apiClient.post('/api/Authentication/forgot-password', { email })
  }

  /**
   * Reset password
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    return apiClient.post('/api/Authentication/reset-password', {
      token,
      newPassword,
    })
  }

  /**
   * Verify user account with email token
   */
  static async verifyAccount(token: string): Promise<void> {
    return apiClient.post('/api/Authentication/verify-account', { token })
  }
}

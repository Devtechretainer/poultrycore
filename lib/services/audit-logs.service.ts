import { apiClient } from '@/lib/api/client'

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId: string
  details: string
  ipAddress: string
  userAgent: string
  timestamp: string
  status: "Success" | "Failed"
}

interface AuditLogFilters {
  userId?: string
  action?: string
  resource?: string
  status?: "Success" | "Failed"
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export class AuditLogsService {
  /**
   * Get all audit logs with optional filters
   */
  static async getAll(filters?: AuditLogFilters): Promise<AuditLog[]> {
    const params = { page: 1, pageSize: 200, ...filters }
    const tryPaths = [
      '/api/AuditLogs',
      '/api/AuditLog',
      '/api/auditlogs',
      '/api/PoultryFarmAPI/AuditLogs',
      '/api/PoultryFarmAPI/AuditLog',
      '/PoultryFarmAPI/AuditLogs',
      '/PoultryFarmAPI/AuditLog',
    ]
    for (const path of tryPaths) {
      try {
        const res: any = await apiClient.get<any>(path, params)
        // Accept multiple shapes: array | {items}| {data} | {result}
        if (Array.isArray(res)) return res as AuditLog[]
        if (Array.isArray(res?.items)) return res.items as AuditLog[]
        if (Array.isArray(res?.data)) return res.data as AuditLog[]
        if (Array.isArray(res?.result)) return res.result as AuditLog[]
      } catch (e) {
        // try next path
      }
    }
    return []
  }

  /**
   * Get a single audit log by ID
   */
  static async getById(id: string): Promise<AuditLog> {
    try {
      return await apiClient.get<AuditLog>(`/api/AuditLogs/${id}`)
    } catch {
      return await apiClient.get<AuditLog>(`/api/AuditLog/${id}`)
    }
  }

  /**
   * Get audit logs by user ID
   */
  static async getByUserId(userId: string): Promise<AuditLog[]> {
    return this.getAll({ userId })
  }

  /**
   * Get audit logs by action type
   */
  static async getByAction(action: string): Promise<AuditLog[]> {
    return this.getAll({ action })
  }

  /**
   * Get audit logs by date range
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<AuditLog[]> {
    return this.getAll({ startDate, endDate })
  }

  /**
   * Export audit logs (returns file download)
   */
  static async export(filters?: AuditLogFilters): Promise<Blob> {
    const tryPaths = [
      '/api/AuditLogs/export',
      '/api/auditlogs/export',
      '/api/PoultryFarmAPI/AuditLogs/export',
      '/PoultryFarmAPI/AuditLogs/export',
    ]
    for (const path of tryPaths) {
      try {
        return await apiClient.get(path, { ...filters, responseType: 'blob' as any })
      } catch {}
    }
    // Fallback empty blob
    return new Blob()
  }
}

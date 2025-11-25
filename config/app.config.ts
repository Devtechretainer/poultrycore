export const appConfig = {
  api: {
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://farmapi.poultrycore.com',
    timeout: 30000,
  },
  app: {
    name: 'Poultry Core',
    version: '1.0.0',
    description: 'Farm Management System',
  },
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enablePWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
  },
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
  },
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
  },
} as const

export type AppConfig = typeof appConfig

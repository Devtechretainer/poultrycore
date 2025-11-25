import { create } from 'zustand'

export type AlertItem = { id: string; title: string; description?: string; time?: string }

type AlertsState = {
  isOpen: boolean
  alerts: AlertItem[]
  open: () => void
  close: () => void
  setAlerts: (items: AlertItem[]) => void
}

export const useAlertsStore = create<AlertsState>((set) => ({
  isOpen: false,
  alerts: [
    { id: 'a1', title: 'Low stock: Layer feed < 5 bags', description: 'Update inventory to avoid shortages', time: new Date().toLocaleString() },
    { id: 'a2', title: 'Unread chat messages', description: 'Open chat to view', time: new Date().toLocaleString() },
  ],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setAlerts: (items) => set({ alerts: items }),
}))



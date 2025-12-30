"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, Bell, User, Menu } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useChatStore } from "@/lib/store/chat-store"
import { useSidebarStore } from "@/lib/store/sidebar-store"
import { useIsMobile } from "@/hooks/use-mobile"

export function DashboardHeader() {
  const router = useRouter()
  const unread = useChatStore((s) => s.unreadCount)
  const openChat = useChatStore((s) => s.openChat)
  const isMobile = useIsMobile()
  const { toggleMobile } = useSidebarStore()
  const [username, setUsername] = useState("")
  const [roleLabel, setRoleLabel] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (typeof window === 'undefined') return
    const u = localStorage.getItem('username') || localStorage.getItem('userName') || ""
    const isStaff = localStorage.getItem('isStaff') === 'true'
    setUsername(u)
    setRoleLabel(isStaff ? 'Staff' : 'Admin')
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    // Store search query in sessionStorage for use across pages
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('globalSearchQuery', searchQuery.trim())
      
      const currentPath = window.location.pathname
      
      // If already on a list page, trigger a custom event that pages can listen to
      if (currentPath.includes('/employees') || 
          currentPath.includes('/customers') || 
          currentPath.includes('/flocks') ||
          currentPath.includes('/sales') ||
          currentPath.includes('/inventory') ||
          currentPath.includes('/expenses')) {
        // Dispatch event for pages to listen to
        window.dispatchEvent(new CustomEvent('globalSearch', { detail: { query: searchQuery.trim() } }))
      } else {
        // Navigate to dashboard - user can navigate to specific pages
        router.push('/dashboard')
      }
    }
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Hamburger Menu Button (Mobile) - Always show on mobile using Tailwind */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('[Header] Hamburger button clicked')
            toggleMobile()
          }}
          className="text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search customers, flocks, sales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:bg-slate-700 focus:border-slate-600"
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="h-5 w-5" />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs text-slate-400">{roleLabel}</span>
              <span className="text-sm text-white truncate max-w-[140px]">{username || 'User'}</span>
            </div>
          </div>
          
          <div className="relative">
            <Button
              onClick={() => openChat()}
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white hover:bg-slate-800 relative"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push('/profile')}
            aria-label="View profile"
          >
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </Button>
        </div>
      </div>
    </header>
  )
}

"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { usePermissions } from "@/hooks/use-permissions"
import { 
  BarChart3, 
  Users, 
  Building2, 
  User, 
  Settings, 	
  LogIn, 
  UserPlus, 
  AlertTriangle,
  ChevronDown,
  Home,
  FileText,
  Egg,
  Package,
  Bird,
  DollarSign,
  LogOut,
  ShoppingCart,
  TrendingUp,
  UserCog,
  Bell,
  ListTodo,
  BookOpen
} from "lucide-react"
import { InventoryLogo } from "@/components/auth/logo"
import { useAlertsStore } from "@/lib/store/alerts-store"

interface SidebarProps {
  onLogout: () => void
}

export function DashboardSidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const permissions = usePermissions()
  const [isPending, startTransition] = useTransition()
  const [productionOpen, setProductionOpen] = useState(true)
  const alerts = useAlertsStore(s => s.alerts)
  const openAlerts = useAlertsStore(s => s.open)

  const mainNavigationItems = [
    { href: "/dashboard", label: "Overview", icon: Home, current: pathname === "/dashboard" },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/flock-batch", label: "Flock Batch", icon: Bird },
    { href: "/flocks", label: "Flocks", icon: Bird },
    { href: "/production-records", label: "Production", icon: FileText },
    { href: "/egg-production", label: "Egg Production", icon: Egg },
    { href: "/feed-usage", label: "Feed Usage", icon: Package },
    { href: "/health", label: "Health", icon: AlertTriangle },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/supplies", label: "Supplies", icon: ShoppingCart },
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/expenses", label: "Expenses", icon: DollarSign },
    { href: "/resources", label: "Resources", icon: BookOpen },
  ]

  const systemNavigationItems = [
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/profile", label: "Account", icon: User },
    { href: "/houses", label: "Houses", icon: Building2 },
    { href: "#", label: "Alerts", icon: Bell },
    { href: "/audit-logs", label: "Audit Logs", icon: ListTodo },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  // Admin-only menu items
  const adminNavigationItems = [
    { href: "/employees", label: "Employees", icon: UserCog },
  ]

  return (
    <div className="flex h-full w-56 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-3 gap-0.5">
        <InventoryLogo />
        <span className="text-white font-bold text-sm whitespace-nowrap ml-2">Poultry Core</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 pb-4 overflow-y-auto scrollbar-hide">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {mainNavigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      pathname === item.href
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors"
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              ))}
              
              {/* Admin-only menu items */}
              {permissions.isAdmin && adminNavigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      pathname === item.href
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors"
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          {/* System Section */}
          <li>
            <div className="px-2 mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                System
              </h3>
            </div>
            <ul role="list" className="-mx-2 space-y-1">
              {systemNavigationItems.map((item) => (
                <li key={item.label}>
                  {item.label === 'Alerts' ? (
                    <button
                      onClick={openAlerts}
                      className={cn(
                        "w-full text-left",
                        "text-slate-300 hover:bg-slate-800 hover:text-white",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors"
                      )}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {alerts.length > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[22px] h-[18px] rounded-full bg-red-600 text-white text-[10px] px-1">
                          {alerts.length > 99 ? '99+' : alerts.length}
                        </span>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        pathname === item.href
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors"
                      )}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 p-4">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
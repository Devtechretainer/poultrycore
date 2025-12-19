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
  ChevronLeft,
  ChevronRight,
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
  BookOpen,
  Menu,
  X
} from "lucide-react"
import { InventoryLogo } from "@/components/auth/logo"
import { useAlertsStore, type AlertItem } from "@/lib/store/alerts-store"
import { useSidebarStore } from "@/lib/store/sidebar-store"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  onLogout: () => void
}

export function DashboardSidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const permissions = usePermissions()
  const [isPending, startTransition] = useTransition()
  const [productionOpen, setProductionOpen] = useState(true)
  const alerts = useAlertsStore((s: { alerts: AlertItem[]; open: () => void }) => s.alerts)
  const openAlerts = useAlertsStore((s: { alerts: AlertItem[]; open: () => void }) => s.open)
  const { isCollapsed, toggle } = useSidebarStore()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    main: true,
    system: true,
    admin: true,
  })

  // Grouped navigation items
  const mainNavigationItems = [
    { href: "/dashboard", label: "Overview", icon: Home, current: pathname === "/dashboard" },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/flock-batch", label: "Flock Batch", icon: Bird },
    { href: "/flocks", label: "Flocks", icon: Bird },
  ]

  const productionNavigationItems = [
    { href: "/production-records", label: "Production", icon: FileText },
    { href: "/egg-production", label: "Egg Production", icon: Egg },
    { href: "/feed-usage", label: "Feed Usage", icon: Package },
  ]

  const inventoryNavigationItems = [
    { href: "/health", label: "Health", icon: AlertTriangle },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/supplies", label: "Supplies", icon: ShoppingCart },
  ]

  const financialNavigationItems = [
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/expenses", label: "Expenses", icon: DollarSign },
  ]

  const otherNavigationItems = [
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

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }))
  }

  const renderMenuItem = (item: { href: string; label: string; icon: any; current?: boolean }, isButton = false, onClick?: () => void) => {
    const isActive = pathname === item.href || item.current
    const content = (
      <div
        className={cn(
          isActive
            ? "bg-slate-800 text-white"
            : "text-slate-300 hover:bg-slate-800 hover:text-white",
          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
          isCollapsed ? "justify-center" : ""
        )}
      >
        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
        {!isCollapsed && <span>{item.label}</span>}
        {isButton && !isCollapsed && alerts.length > 0 && item.label === 'Alerts' && (
          <span className="ml-auto inline-flex items-center justify-center min-w-[22px] h-[18px] rounded-full bg-red-600 text-white text-[10px] px-1">
            {alerts.length > 99 ? '99+' : alerts.length}
          </span>
        )}
      </div>
    )

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {isButton ? (
              <button onClick={onClick} className="w-full">
                {content}
              </button>
            ) : (
              <Link href={item.href} prefetch={true} className="block">
                {content}
              </Link>
            )}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
            {item.label}
            {isButton && alerts.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-600 text-white text-[10px] px-1">
                {alerts.length > 99 ? '99+' : alerts.length}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }

    return isButton ? (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    ) : (
      <Link href={item.href} prefetch={true} className="block">
        {content}
      </Link>
    )
  }

  const renderGroup = (title: string, items: typeof mainNavigationItems, groupKey: string) => {
    if (isCollapsed) {
      return (
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                {item.label === 'Alerts' ? (
                  renderMenuItem(item, true, openAlerts)
                ) : (
                  renderMenuItem(item)
                )}
              </li>
            ))}
          </ul>
        </li>
      )
    }

    return (
      <li>
        <button
          onClick={() => toggleGroup(groupKey)}
          className="w-full flex items-center justify-between px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
        >
          <span>{title}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              openGroups[groupKey] ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>
        {openGroups[groupKey] && (
          <ul role="list" className="-mx-2 space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                {item.label === 'Alerts' ? (
                  renderMenuItem(item, true, openAlerts)
                ) : (
                  renderMenuItem(item)
                )}
              </li>
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className={cn(
      "flex h-full flex-col bg-slate-900 transition-all duration-300",
      isCollapsed ? "w-16" : "w-56"
    )}>
      {/* Logo and Toggle */}
      <div className="flex h-16 shrink-0 items-center px-3 gap-0.5 border-b border-slate-800">
        {!isCollapsed && (
          <InventoryLogo />
        )}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="mx-auto text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Expand sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
              Show Sidebar
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="ml-auto text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Hide sidebar"
            title="Hide Sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 pb-4 overflow-y-auto scrollbar-hide">
        <ul role="list" className="flex flex-1 flex-col gap-y-4">
          {/* Main Navigation */}
          {renderGroup("Main", mainNavigationItems, "main")}

          {/* Production Group */}
          {renderGroup("Production", productionNavigationItems, "production")}

          {/* Inventory Group */}
          {renderGroup("Inventory", inventoryNavigationItems, "inventory")}

          {/* Financial Group */}
          {renderGroup("Financial", financialNavigationItems, "financial")}

          {/* Other */}
          {renderGroup("Other", otherNavigationItems, "other")}

          {/* Admin-only menu items */}
          {permissions.isAdmin && renderGroup("Admin", adminNavigationItems, "admin")}

          {/* System Section */}
          {renderGroup("System", systemNavigationItems, "system")}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 p-4">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="w-full text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
              Logout
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        )}
      </div>
    </div>
  )
}
import { useEffect, useState } from "react"

export interface UserPermissions {
  canDelete: boolean
  canEdit: boolean
  canCreate: boolean
  canView: boolean
  isAdmin: boolean
  isStaff: boolean
  isSubscriber: boolean
  roles: string[]
  isLoading: boolean
}

export function usePermissions(): UserPermissions {
  const [permissions, setPermissions] = useState<UserPermissions>({
    canDelete: false,
    canEdit: false,
    canCreate: false,
    canView: false,
    isAdmin: false,
    isStaff: false,
    isSubscriber: false,
    roles: [],
    isLoading: true,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    // Get user roles and flags from localStorage
    // Handle both string "true"/"false" and boolean values
    const isStaffStr = localStorage.getItem("isStaff")
    const isStaff = isStaffStr === "true" || isStaffStr === true
    const isSubscriberStr = localStorage.getItem("isSubscriber")
    const isSubscriber = isSubscriberStr === "true" || isSubscriberStr === true
    const rolesString = localStorage.getItem("roles") || "[]"
    
    let roles: string[] = []
    try {
      roles = JSON.parse(rolesString)
    } catch (e) {
      console.error("[v0] Error parsing roles:", e)
      roles = []
    }

    // If no roles found, set default based on staff status
    if (roles.length === 0) {
      if (isStaff) {
        roles = ["Staff", "User"]
        localStorage.setItem("roles", JSON.stringify(roles))
        console.log("[v0] No roles found, defaulting to Staff for employee")
      } else {
        roles = ["Admin", "FarmAdmin"]
        localStorage.setItem("roles", JSON.stringify(roles))
        console.log("[v0] No roles found, defaulting to Admin for non-staff user")
      }
    }

    // Determine if user is admin
    // Admin can be identified by:
    // 1. Having "Admin" or "FarmAdmin" role (even if marked as staff)
    // 2. Being a subscriber (owner)
    // 3. NOT being staff (non-staff users default to admin)
    const hasAdminRole = roles.includes("Admin") || roles.includes("FarmAdmin") || roles.includes("Owner")
    const isAdmin = hasAdminRole || isSubscriber || !isStaff

    // Set permissions based on role
    const userPermissions: UserPermissions = {
      canView: true,        // Everyone can view
      canCreate: true,      // Everyone can create
      canEdit: true,        // Everyone can edit
      canDelete: isAdmin,   // Only admins can delete
      isAdmin,
      isStaff,
      isSubscriber,
      roles,
      isLoading: false,
    }

    console.log("[v0] ===== USER PERMISSIONS =====")
    console.log("[v0] isStaff:", isStaff)
    console.log("[v0] isSubscriber:", isSubscriber)
    console.log("[v0] roles:", roles)
    console.log("[v0] isAdmin:", isAdmin)
    console.log("[v0] canDelete:", isAdmin)
    console.log("[v0] ===============================")
    
    setPermissions(userPermissions)
  }, [])

  return permissions
}

// Helper function to check if user has specific permission
export function hasPermission(permission: keyof UserPermissions, permissions: UserPermissions): boolean {
  return permissions[permission] === true
}


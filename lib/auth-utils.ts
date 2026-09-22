import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export type Role = "ADMIN" | "EMPLOYEE"

export function isAdmin(role?: Role): boolean {
  return role === "ADMIN"
}

export function getRoleHomePath(role?: Role): string {
  return isAdmin(role) ? "/admin/dashboard" : "/employee/dashboard"
}

export type ActiveStatus =
  | { active: true; role: Role }
  | { active: false; reason: "account_deactivated" }
  | { active: false; reason: "shop_deactivated"; shopName: string }

/**
 * Fetch the user's role and active status in a single query.
 * Used by requireRole() (layouts/pages) and getSignedInRole()
 * (server actions) — the DB was already being hit for the role,
 * so the extra columns cost nothing.
 */
async function getUserStatus(userId: string): Promise<ActiveStatus | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      isActive: true,
      employee: {
        select: {
          isActive: true,
          shop: { select: { isActive: true, name: true } },
        },
      },
    },
  })

  if (!user) return null

  if (!user.isActive) {
    return { active: false, reason: "account_deactivated" }
  }

  if (user.role === "EMPLOYEE" && user.employee) {
    if (!user.employee.isActive) {
      return { active: false, reason: "account_deactivated" }
    }
    if (!user.employee.shop.isActive) {
      return {
        active: false,
        reason: "shop_deactivated",
        shopName: user.employee.shop.name,
      }
    }
  }

  return { active: true, role: user.role as Role }
}

export async function getSignedInRole(): Promise<{
  userId: string | null
  role?: Role
}> {
  const session = await auth()
  if (!session?.user?.id) return { userId: null }

  const status = await getUserStatus(session.user.id)
  // Deactivated or deleted users are treated as signed out —
  // server actions reject them and the root page redirects to /login.
  if (!status?.active) return { userId: null }
  return { userId: session.user.id, role: status.role }
}

/**
 * Server-side enforcement of role + active status. Replaces the old
 * per-request DB check in middleware (proxy.ts is now JWT-only) —
 * this runs once per navigation in the layouts, not on every request.
 */
export async function requireRole(requiredRole: Role) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  const status = await getUserStatus(session.user.id)
  if (!status?.active) {
    // Mirror the old middleware redirects so the login page can
    // show a meaningful toast instead of just "invalid session".
    if (status?.reason === "shop_deactivated") {
      redirect(
        `/login?error=shop_deactivated&shop=${encodeURIComponent(status.shopName)}`
      )
    }
    redirect("/login?error=account_deactivated")
  }
  if (status.role !== requiredRole) {
    redirect("/login")
  }
}

export type EmployeeContext = {
  userId: string
  employeeId: string
  shopId: string
  shopName: string
  position: string | null
  firstName: string
  lastName: string
  email: string
}

export async function getEmployeeContext(): Promise<EmployeeContext | null> {
  const { userId, role } = await getSignedInRole()
  if (!userId || role !== "EMPLOYEE") return null

  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: {
      shop: { select: { id: true, name: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  })
  if (!employee?.isActive) return null

  return {
    userId,
    employeeId: employee.id,
    shopId: employee.shopId,
    shopName: employee.shop.name,
    position: employee.position,
    firstName: employee.user.firstName ?? "",
    lastName: employee.user.lastName ?? "",
    email: employee.user.email,
  }
}

export async function requireEmployeeContext(): Promise<EmployeeContext> {
  const ctx = await getEmployeeContext()
  if (!ctx) redirect("/login")
  return ctx
}

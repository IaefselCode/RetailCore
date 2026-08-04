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

async function getRole(userId: string): Promise<Role | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role
}

export async function getSignedInRole(): Promise<{
  userId: string | null
  role?: Role
}> {
  const session = await auth()
  if (!session?.user?.id) return { userId: null }
  return { userId: session.user.id, role: await getRole(session.user.id) }
}

export async function requireRole(requiredRole: Role) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  const role = await getRole(session.user.id)
  if (role !== requiredRole) {
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

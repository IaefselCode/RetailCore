import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE"

const roleHierarchy: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MANAGER: 50,
  EMPLOYEE: 20,
}

export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
  return (roleHierarchy[userRole] ?? 0) >= (roleHierarchy[requiredRole] ?? 0)
}

export async function requireRole(requiredRole: Role) {
  const session = await auth()
  if (!session.userId) {
    redirect("/login")
  }
  const role = (session.sessionClaims?.metadata as { role?: Role })?.role
  if (!role || !hasMinRole(role, requiredRole)) {
    redirect("/login")
  }
}

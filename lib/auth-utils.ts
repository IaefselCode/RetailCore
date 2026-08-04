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

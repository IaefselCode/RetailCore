"use server"

import { prisma } from "@/lib/prisma"

/**
 * Pre-check account status before calling signIn.
 * Returns a specific error code so the login page can show
 * a meaningful message instead of "Invalid credentials".
 */
export type LoginStatus =
  | { ok: true }
  | { ok: false; error: "account_deactivated" }
  | { ok: false; error: "shop_deactivated"; shopName?: string }
  | { ok: false; error: "not_found" }

export async function checkLoginStatus(email: string): Promise<LoginStatus> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return { ok: true }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      isActive: true,
      role: true,
      employee: {
        select: {
          isActive: true,
          shop: {
            select: { isActive: true, name: true },
          },
        },
      },
    },
  })

  // User doesn't exist — let the normal auth flow handle it
  if (!user) return { ok: true }

  // User account is deactivated
  if (!user.isActive) {
    return { ok: false, error: "account_deactivated" }
  }

  // Employee's shop is deactivated
  if (
    user.role === "EMPLOYEE" &&
    user.employee &&
    !user.employee.shop.isActive
  ) {
    return { ok: false, error: "shop_deactivated", shopName: user.employee.shop.name }
  }

  // Employee themselves is deactivated (Employee.isActive, not User.isActive)
  if (user.role === "EMPLOYEE" && user.employee && !user.employee.isActive) {
    return { ok: false, error: "account_deactivated" }
  }

  return { ok: true }
}


/**
 * Check if the currently authenticated user (from session) is still active.
 * Called by the client-side SessionMonitor to detect deactivation while logged in.
 */
export type SessionCheckResult =
  | { active: true }
  | { active: false; error: 'account_deactivated'; shopName?: string }
  | { active: false; error: 'shop_deactivated'; shopName: string }
  | { active: false; error: 'not_found' }

export async function checkSessionStatus(): Promise<SessionCheckResult> {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (!session?.user?.id) {
    return { active: false, error: 'not_found' }
  }

  const userId = session.user.id as string
  const role = session.user.role as string | undefined

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      employee: {
        select: {
          isActive: true,
          shop: {
            select: { isActive: true, name: true },
          },
        },
      },
    },
  })

  if (!user || !user.isActive) {
    return { active: false, error: 'account_deactivated' }
  }

  if (role === 'EMPLOYEE' && user.employee) {
    if (!user.employee.isActive) {
      return { active: false, error: 'account_deactivated', shopName: user.employee.shop.name }
    }
    if (!user.employee.shop.isActive) {
      return { active: false, error: 'shop_deactivated', shopName: user.employee.shop.name }
    }
  }

  return { active: true }
}
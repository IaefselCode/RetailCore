"use server"

import { prisma } from "@/lib/prisma"

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
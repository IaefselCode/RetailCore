"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { stockStatusKey } from "@/lib/stock-status"
import { pushNotification } from "../server/ws-publisher"

export interface NotificationData {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
}

async function requireUser(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

/** Fetch all notifications for the current user, newest first. */
export async function getNotifications(): Promise<NotificationData[]> {
  const userId = await requireUser()
  if (!userId) return []

  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
}

/** Mark a single notification as read. */
export async function markAsRead(notificationId: string): Promise<void> {
  const userId = await requireUser()
  if (!userId) return

  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  })

  revalidatePath("/admin/notifications")
  revalidatePath("/employee/notifications")
}

/** Mark all notifications as read for the current user. */
export async function markAllAsRead(): Promise<void> {
  const userId = await requireUser()
  if (!userId) return

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })

  revalidatePath("/admin/notifications")
  revalidatePath("/employee/notifications")
}

/** Delete a single notification. */
export async function deleteNotification(notificationId: string): Promise<void> {
  const userId = await requireUser()
  if (!userId) return

  await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  })

  revalidatePath("/admin/notifications")
  revalidatePath("/employee/notifications")
}


export interface NotificationPreferenceData {
  emailEnabled: boolean
  pushEnabled: boolean
  stockAlerts: boolean
  shiftReminders: boolean
  salesReports: boolean
}

/** Get notification preferences for the current user. */
export async function getNotificationPreferences(): Promise<NotificationPreferenceData> {
  const userId = await requireUser()
  if (!userId) return { emailEnabled: true, pushEnabled: true, stockAlerts: true, shiftReminders: true, salesReports: false }

  try {
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } })
    if (!prefs) return { emailEnabled: true, pushEnabled: true, stockAlerts: true, shiftReminders: true, salesReports: false }

    return {
      emailEnabled: prefs.emailEnabled,
      pushEnabled: prefs.pushEnabled,
      stockAlerts: prefs.stockAlerts,
      shiftReminders: prefs.shiftReminders,
      salesReports: prefs.salesReports,
    }
  } catch {
    return { emailEnabled: true, pushEnabled: true, stockAlerts: true, shiftReminders: true, salesReports: false }
  }
}

/** Update notification preferences for the current user. */
export async function updateNotificationPreferences(prefs: Partial<NotificationPreferenceData>): Promise<void> {
  const userId = await requireUser()
  if (!userId) return

  try {
    await prisma.notificationPreference.upsert({
      where: { userId },
      update: prefs,
      create: {
        userId,
        emailEnabled: prefs.emailEnabled ?? true,
        pushEnabled: prefs.pushEnabled ?? true,
        stockAlerts: prefs.stockAlerts ?? true,
        shiftReminders: prefs.shiftReminders ?? true,
        salesReports: prefs.salesReports ?? false,
      },
    })
  } catch {
    // NotificationPreference table may not exist yet — silently ignore
  }
}

/** Create a notification for a user. Used by event triggers.
 *  Respects the user's NotificationPreference — skips if the relevant
 *  toggle is off (pushEnabled for general, stockAlerts for stock, etc.).
 */
export async function createNotification(
  userId: string,
  notification: { title: string; message: string; type?: string }
): Promise<void> {
  const type = notification.type ?? "info"

  // Look up the user's preferences (fast path: skip if no preference row — default to allowing)
  try {
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } })
    if (prefs) {
      // Global push toggle — if off, suppress all in-app notifications
      if (!prefs.pushEnabled) return

      // Type-specific toggles
      if (type === "stock" && !prefs.stockAlerts) return
      if (type === "sales" && !prefs.salesReports) return
      // "info", "system", "operational" — no extra toggle, pushEnabled covers them
    }
  } catch {
    // NotificationPreference table may not exist yet — fall through to allow all notifications
  }

  const created = await prisma.notification.create({
    data: {
      userId,
      title: notification.title,
      message: notification.message,
      type,
    },
  })

  // Push to connected browser(s) in realtime via WebSocket
  pushNotification(userId, {
    id: created.id,
    title: created.title,
    message: created.message,
    type: created.type,
    isRead: created.isRead,
    createdAt: created.createdAt.toISOString(),
  })
}

/** Notify all admin users. */
export async function notifyAdmins(notification: { title: string; message: string; type?: string }): Promise<void> {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } })
  for (const admin of admins) {
    await createNotification(admin.id, notification)
  }
}

/** Notify all active employees. */
export async function notifyEmployees(notification: { title: string; message: string; type?: string }): Promise<void> {
  const employees = await prisma.user.findMany({ where: { role: "EMPLOYEE", isActive: true }, select: { id: true } })
  for (const emp of employees) {
    await createNotification(emp.id, notification)
  }
}

/** Notify employees at a specific shop. */
export async function notifyShopEmployees(
  shopId: string,
  notification: { title: string; message: string; type?: string }
): Promise<void> {
  const employees = await prisma.employee.findMany({
    where: { shopId, isActive: true },
    select: { userId: true },
  })
  for (const emp of employees) {
    await createNotification(emp.userId, notification)
  }
}

// ---------------------------------------------------------------------------
// Stock health helper — shared by purchaseStock, recordSale, distributeStock
// ---------------------------------------------------------------------------

interface StockHealthInventoryRow {
  quantity: number
  minStock: number
  maxStock: number
  product: { name: string }
  shop: { name: string }
}

const STATUS_LABELS: Record<string, string> = {
  statusOut: "out of stock",
  statusLow: "low stock",
  statusOver: "overstocked",
}

/**
 * Check inventory rows for a set of products at a shop and notify admins
 * about any items that are out of stock, low, or overstocked.
 */
export async function checkAndNotifyStockHealth(
  shopId: string,
  productIds: string[],
): Promise<void> {
  if (productIds.length === 0) return

  const rows = await prisma.inventory.findMany({
    where: { productId: { in: productIds }, shopId },
    include: { product: { select: { name: true } }, shop: { select: { name: true } } },
  })

  for (const row of rows) {
    const status = stockStatusKey(row.quantity, row.minStock, row.maxStock)
    if (status === "statusIn") continue // healthy — no notification

    const label = STATUS_LABELS[status] ?? status
    await notifyAdmins({
      title: label.charAt(0).toUpperCase() + label.slice(1),
      message:
        row.product.name +
        " at " +
        row.shop.name +
        " — " +
        row.quantity +
        " units (" +
        label + ")",
      type: "stock",
    })
  }
}

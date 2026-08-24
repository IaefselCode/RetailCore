import { getIOOrNull } from "./ws"

export interface NotificationPayload {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string // ISO string (serialisable)
}

/**
 * Push a notification to a specific user's connected browser(s).
 * No-op when Socket.IO is not initialised (e.g. during `prisma generate`).
 */
export function pushNotification(userId: string, notification: NotificationPayload): void {
  const io = getIOOrNull()
  if (!io) return

  io.to(`user:${userId}`).emit("notification:new", notification)
}

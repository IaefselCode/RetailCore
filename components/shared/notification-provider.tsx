"use client"

import { useNotificationSocket } from "@/lib/use-notification-sse"
import { NotificationContext } from "@/lib/notification-context"
import { NotificationToast } from "@/components/shared/notification-toast"

export function NotificationProvider({
  userId,
  initialCount,
  children,
}: {
  userId: string | null
  initialCount: number
  children: React.ReactNode
}) {
  const {
    unreadCount,
    latestNotification,
    dismissLatest,
    markNotificationRead,
    markAllNotificationsRead,
    decrementCount,
  } = useNotificationSocket(userId, initialCount)

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        markRead: markNotificationRead,
        markAllRead: markAllNotificationsRead,
        deleteNotification: () => decrementCount(),
        deleteAll: () => markAllNotificationsRead(),
      }}
    >
      <NotificationToast notification={latestNotification} onDismiss={dismissLatest} />
      {children}
    </NotificationContext.Provider>
  )
}

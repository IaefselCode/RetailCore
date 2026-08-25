"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { useNotificationSocket } from "@/lib/use-notification-socket"
import { NotificationToast } from "@/components/shared/notification-toast"
import { NotificationContext } from "@/lib/notification-context"

export function NotificationBadge({
  userId,
  initialCount,
  href,
  size = "icon-sm",
  children,
}: {
  userId: string | null
  initialCount: number
  href: string
  size?: "icon" | "icon-sm"
  children?: React.ReactNode
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
      <Link href={href}>
        <AnimateButton variant="ghost" size={size} className="relative" aria-label="Notifications">
          <span className="relative inline-flex">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] leading-none font-semibold text-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
        </AnimateButton>
      </Link>
    </NotificationContext.Provider>
  )
}

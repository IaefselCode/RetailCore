"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { useNotificationSocket } from "@/lib/use-notification-socket"
import { NotificationToast } from "@/components/shared/notification-toast"

export function NotificationBadge({
  userId,
  initialCount,
  href,
  size = "icon-sm",
}: {
  userId: string | null
  initialCount: number
  href: string
  size?: "icon" | "icon-sm"
}) {
  const { unreadCount, latestNotification, dismissLatest } = useNotificationSocket(userId, initialCount)

  return (
    <>
      <NotificationToast notification={latestNotification} onDismiss={dismissLatest} />
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
    </>
  )
}

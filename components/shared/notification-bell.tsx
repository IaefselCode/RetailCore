"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { useNotificationContext } from "@/lib/notification-context"

export function NotificationBell({
  href,
  size = "icon-sm",
}: {
  href: string
  size?: "icon" | "icon-sm"
}) {
  const { unreadCount } = useNotificationContext() as { unreadCount: number }

  return (
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
  )
}

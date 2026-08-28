"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Bell, AlertTriangle, ShoppingCart, Package, AlertCircle } from "lucide-react"
import type { RealtimeNotification } from "@/lib/use-notification-sse"

const TYPE_ICONS: Record<string, typeof Bell> = {
  stock: AlertTriangle,
  sales: ShoppingCart,
  system: Package,
  operational: Bell,
  info: Bell,
}

const TYPE_COLORS: Record<string, string> = {
  stock: "text-orange-500",
  sales: "text-emerald-500",
  system: "text-blue-500",
  operational: "text-primary",
  info: "text-muted-foreground",
}

export function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: RealtimeNotification | null
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!notification) return

    const Icon = TYPE_ICONS[notification.type] ?? Bell
    const color = TYPE_COLORS[notification.type] ?? "text-muted-foreground"

    toast(notification.title, {
      description: notification.message,
      icon: <Icon className={`size-4 ${color}`} />,
      duration: 5000,
      onDismiss,
      action: {
        label: "View",
        onClick: () => {
          const role = window.location.pathname.startsWith("/admin") ? "admin" : "employee"
          window.location.href = `/${role}/notifications`
        },
      },
    })
  }, [notification, onDismiss])

  return null
}

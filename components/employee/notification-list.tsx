"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { Bell, Clock, Package, BarChart3, CheckCheck, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { AnimateButton } from "@/components/ui/animate-button"
import {
  AnimatedAccordion,
  AnimatedAccordionItem,
  AnimatedAccordionTrigger,
  AnimatedAccordionContent,
} from "@/components/ui/animated-accordion"
import { markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, type NotificationData } from "@/lib/notification-actions"
import { useRouter } from "next/navigation"

const iconMap: Record<string, typeof Bell> = {
  info: Bell,
  stock: Package,
  milestone: BarChart3,
  system: Bell,
  warning: Clock,
}

function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return "1 day ago"
  if (diffD < 7) return `${diffD} days ago`
  return `${Math.floor(diffD / 7)} week${Math.floor(diffD / 7) > 1 ? "s" : ""} ago`
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export function EmployeeNotificationList({ initialNotifications }: { initialNotifications: NotificationData[] }) {
  const t = useTranslations("employeeNotifications")
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const todayNotifications = notifications.filter((n) => {
    const diff = Date.now() - new Date(n.createdAt).getTime()
    return diff < 86400000
  })
  const earlierNotifications = notifications.filter((n) => {
    const diff = Date.now() - new Date(n.createdAt).getTime()
    return diff >= 86400000
  })

  async function handleMarkAllRead() {
    await markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  async function handleToggleRead(id: string) {
    await markAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  async function handleDelete(id: string) {
    await deleteNotification(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    router.refresh()
  }

  async function handleDeleteAll() {
    await deleteAllNotifications()
    setNotifications([])
    router.refresh()
  }

  function renderNotification(notification: NotificationData, index: number) {
    const Icon = iconMap[notification.type] ?? Bell
    return (
      <motion.div
        key={notification.id}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: index * 0.05 }}
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
          !notification.isRead ? "border-l-2 border-l-primary bg-muted/20" : ""
        }`}
        onClick={() => handleToggleRead(notification.id)}
      >
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            !notification.isRead ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm ${!notification.isRead ? "font-semibold" : "font-medium text-muted-foreground"}`}>
              {notification.title}
            </p>
            {!notification.isRead && <Badge className="size-2 rounded-full p-0" />}
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="mt-0.5 text-xs text-muted-foreground/60">{timeAgo(new Date(notification.createdAt))}</p>
        </div>
        <AnimateButton
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete(notification.id)
          }}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon className="size-3.5" />
        </AnimateButton>
      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? unreadCount === 1
                ? t("unread", { count: unreadCount })
                : t("unreadPlural", { count: unreadCount })
              : t("allCaughtUp")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <AnimateButton variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="size-4" />
              {t("markAllRead")}
            </AnimateButton>
          )}
          {notifications.length > 0 && (
            <AnimateButton variant="outline" size="sm" onClick={handleDeleteAll} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2Icon className="size-4" />
              {t("deleteAll")}
            </AnimateButton>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
            <Bell className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{t("allCaughtUp")}</p>
        </div>
      ) : (
        <AnimatedAccordion type="multiple" defaultValue={["today"]}>
          <AnimatedAccordionItem value="today">
            <AnimatedAccordionTrigger showArrow={false}>{t("today")}</AnimatedAccordionTrigger>
            <AnimatedAccordionContent>
              <div className="space-y-1 pt-2">
                {todayNotifications.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">{t("allCaughtUp")}</p>
                ) : (
                  todayNotifications.map((n, i) => renderNotification(n, i))
                )}
              </div>
            </AnimatedAccordionContent>
          </AnimatedAccordionItem>
          <AnimatedAccordionItem value="earlier">
            <AnimatedAccordionTrigger showArrow={false}>{t("earlier")}</AnimatedAccordionTrigger>
            <AnimatedAccordionContent>
              <div className="space-y-1 pt-2">
                {earlierNotifications.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">{t("allCaughtUp")}</p>
                ) : (
                  earlierNotifications.map((n, i) => renderNotification(n, i))
                )}
              </div>
            </AnimatedAccordionContent>
          </AnimatedAccordionItem>
        </AnimatedAccordion>
      )}
    </div>
  )
}

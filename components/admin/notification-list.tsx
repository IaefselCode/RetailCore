"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { SettingsIcon, CheckCheckIcon, BellIcon, PackageIcon, AwardIcon, UserPlusIcon, AlertTriangleIcon, Trash2Icon } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/animated-accordion"
import Link from "next/link"
import { markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, type NotificationData } from "@/lib/notification-actions"
import { useRouter } from "next/navigation"

const iconMap: Record<string, typeof BellIcon> = {
  system: BellIcon,
  stock: PackageIcon,
  milestone: AwardIcon,
  operational: UserPlusIcon,
  info: BellIcon,
  warning: AlertTriangleIcon,
}

function getGroup(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 24) return "Today"
  if (diffHours < 48) return "Yesterday"
  if (diffHours < 168) return "This Week"
  return "Older"
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

const groupOrder = ["Today", "Yesterday", "This Week", "Older"]

export function NotificationList({ initialNotifications }: { initialNotifications: NotificationData[] }) {
  const t = useTranslations("notifications")
  const tc = useTranslations("nav")
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const grouped = notifications.reduce<Record<string, NotificationData[]>>((acc, n) => {
    const g = getGroup(new Date(n.createdAt))
    if (!acc[g]) acc[g] = []
    acc[g].push(n)
    return acc
  }, {})

  const groupLabel = (g: string) =>
    g === "Today" ? t("today") : g === "Yesterday" ? t("yesterday") : g === "This Week" ? t("thisWeek") : t("older")

  async function handleMarkAllRead() {
    await markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  async function handleMarkRead(id: string) {
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

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{tc("dashboard")}</span>
        <span className="mx-1">/</span>
        <span className="text-foreground">{t("breadcrumb")}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium">{t("title")}</h1>
          {unreadCount > 0 && (
            <Badge variant="default" className="rounded-full">{t("new", { count: unreadCount })}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AnimateButton variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            <CheckCheckIcon />
            {t("markAllRead")}
          </AnimateButton>
          <AnimateButton variant="outline" onClick={handleDeleteAll} disabled={notifications.length === 0} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2Icon />
            {t("deleteAll")}
          </AnimateButton>
          <Link href="/admin/settings">
            <AnimateButton variant="ghost" size="icon-sm">
              <SettingsIcon />
            </AnimateButton>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
                <BellIcon className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t("empty")}</p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={["Today"]}>
              {groupOrder.filter((g) => grouped[g]?.length).map((group) => (
                <AccordionItem key={group} value={group}>
                  <AccordionTrigger className="px-4 text-sm font-semibold text-muted-foreground">
                    {groupLabel(group)}
                    <Badge variant="secondary" className="ml-2">{grouped[group].length}</Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="divide-y">
                      {grouped[group].map((notification) => {
                        const Icon = iconMap[notification.type] ?? BellIcon
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                              !notification.isRead ? "bg-primary/5" : ""
                            }`}
                          >
                            <div
                              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                                notification.isRead ? "bg-muted" : "bg-primary/10"
                              }`}
                              onClick={() => handleMarkRead(notification.id)}
                            >
                              <Icon className={`size-5 ${notification.isRead ? "text-muted-foreground" : "text-primary"}`} />
                            </div>
                            <div className="flex-1 min-w-0" onClick={() => handleMarkRead(notification.id)}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                  {notification.title}
                                </span>
                                {!notification.isRead && (
                                  <span className="size-2 shrink-0 rounded-full bg-primary" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                              <span className="text-xs text-muted-foreground mt-1 block">{timeAgo(new Date(notification.createdAt))}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="capitalize">
                                {notification.type}
                              </Badge>
                              <AnimateButton
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDelete(notification.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2Icon className="size-3.5" />
                              </AnimateButton>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

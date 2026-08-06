"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { ChevronRightIcon, SettingsIcon, CheckCheckIcon, BellIcon, PackageIcon, AwardIcon, UserPlusIcon, AlertTriangleIcon } from "lucide-react"
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

interface Notification {
  id: string
  icon: typeof BellIcon
  title: string
  description: string
  time: string
  read: boolean
  type: "system" | "operational" | "milestone" | "stock"
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    icon: BellIcon,
    title: "New shop created",
    description: "Downtown Flagship has been added as a new location",
    time: "2 min ago",
    read: false,
    type: "system",
  },
  {
    id: "2",
    icon: PackageIcon,
    title: "Low stock alert",
    description: "SonicFlow X1 Headphones is running low (12 units remaining)",
    time: "15 min ago",
    read: false,
    type: "stock",
  },
  {
    id: "3",
    icon: AwardIcon,
    title: "Sales milestone reached",
    description: "Total revenue has surpassed $300K this quarter",
    time: "1 hour ago",
    read: false,
    type: "milestone",
  },
  {
    id: "4",
    icon: UserPlusIcon,
    title: "New employee onboarded",
    description: "Sarah Chen has been added to the Downtown Flagship team",
    time: "3 hours ago",
    read: true,
    type: "operational",
  },
  {
    id: "5",
    icon: AlertTriangleIcon,
    title: "System maintenance scheduled",
    description: "Server downtime scheduled for Sunday 2:00 AM - 4:00 AM",
    time: "5 hours ago",
    read: true,
    type: "system",
  },
  {
    id: "6",
    icon: BellIcon,
    title: "New shop created",
    description: "Airport Terminal 3 kiosk has been registered",
    time: "1 day ago",
    read: true,
    type: "system",
  },
]

function getGroup(time: string): string {
  if (time.includes("min") || time.includes("hour")) return "Today"
  if (time.includes("day")) return "Yesterday"
  if (time.includes("week")) return "This Week"
  return "Older"
}

const groupOrder = ["Today", "Yesterday", "This Week", "Older"]

export default function NotificationsPage() {
  const t = useTranslations("notifications")
  const tc = useTranslations("nav")
  const [notifications, setNotifications] = useState(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const grouped = useMemo(() => {
    const map: Record<string, Notification[]> = {}
    for (const n of notifications) {
      const g = getGroup(n.time)
      if (!map[g]) map[g] = []
      map[g].push(n)
    }
    return map
  }, [notifications])

  const groupLabel = (g: string) =>
    g === "Today" ? t("today") : g === "Yesterday" ? t("yesterday") : g === "This Week" ? t("thisWeek") : t("older")

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{tc("dashboard")}</span>
        <ChevronRightIcon className="size-3.5" />
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
          <AnimateButton variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCheckIcon />
            {t("markAllRead")}
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
          <Accordion type="multiple" defaultValue={["Today"]}>
            {groupOrder.filter((g) => grouped[g]?.length).map((group) => (
              <AccordionItem key={group} value={group}>
                <AccordionTrigger className="px-4 text-sm font-semibold text-muted-foreground">
                  {groupLabel(group)}
                  <Badge variant="secondary" className="ml-2">{grouped[group].length}</Badge>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="divide-y">
                    {grouped[group].map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => markAsRead(notification.id)}
                        className={`flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-muted/50 ${!notification.read ? "bg-primary/5" : ""}`}
                      >
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${notification.read ? "bg-muted" : "bg-primary/10"}`}>
                          <notification.icon className={`size-5 ${notification.read ? "text-muted-foreground" : "text-primary"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <span className="size-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{notification.description}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">{notification.time}</span>
                        </div>
                        <Badge variant="outline" className="shrink-0 capitalize">
                          {notification.type}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

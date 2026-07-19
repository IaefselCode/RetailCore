"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Bell, Clock, Package, BarChart3, CheckCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { AnimateButton } from "@/components/ui/animate-button"
import {
  AnimatedAccordion,
  AnimatedAccordionItem,
  AnimatedAccordionTrigger,
  AnimatedAccordionContent,
} from "@/components/ui/animated-accordion"

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

interface Notification {
  id: number
  icon: typeof Bell
  title: string
  description: string
  time: string
  read: boolean
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    icon: Clock,
    title: "Shift Reminder",
    description: "Your shift starts in 30 minutes",
    time: "5 min ago",
    read: false,
  },
  {
    id: 2,
    icon: Package,
    title: "New Product Added",
    description: "SonicFlow X1 has been added to the catalog",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    icon: BarChart3,
    title: "Weekly Sales Summary",
    description: "Your weekly sales summary is now available",
    time: "3h ago",
    read: false,
  },
  {
    id: 4,
    icon: Bell,
    title: "Stock Alert",
    description: "DataSync Hub is critically low (1 remaining)",
    time: "5h ago",
    read: true,
  },
  {
    id: 5,
    icon: Bell,
    title: "Schedule Update",
    description: "Your shift for next week has been updated",
    time: "1 day ago",
    read: true,
  },
  {
    id: 6,
    icon: Bell,
    title: "Training Reminder",
    description: "New product training session tomorrow at 10AM",
    time: "1 day ago",
    read: true,
  },
]

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const toggleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    )
  }

  const todayNotifications = notifications.filter((n) => n.time.includes("min") || n.time.includes("h"))
  const earlierNotifications = notifications.filter((n) => n.time.includes("day"))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <AnimateButton variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="size-4" />
            Mark All as Read
          </AnimateButton>
        )}
      </div>

      <AnimatedAccordion type="multiple" defaultValue={["today"]}>
        <AnimatedAccordionItem value="today">
          <AnimatedAccordionTrigger showArrow={false}>Today</AnimatedAccordionTrigger>
          <AnimatedAccordionContent>
            <div className="space-y-1 pt-2">
              {todayNotifications.map((notification, index) => {
                const Icon = notification.icon
                return (
                  <motion.div
                    key={notification.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      !notification.read ? "border-l-2 border-l-primary bg-muted/20" : ""
                    }`}
                    onClick={() => toggleRead(notification.id)}
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        !notification.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm ${
                            !notification.read ? "font-semibold" : "font-medium text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && <Badge className="size-2 rounded-full p-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/60">{notification.time}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatedAccordionContent>
        </AnimatedAccordionItem>
        <AnimatedAccordionItem value="earlier">
          <AnimatedAccordionTrigger showArrow={false}>Earlier</AnimatedAccordionTrigger>
          <AnimatedAccordionContent>
            <div className="space-y-1 pt-2">
              {earlierNotifications.map((notification, index) => {
                const Icon = notification.icon
                return (
                  <motion.div
                    key={notification.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      !notification.read ? "border-l-2 border-l-primary bg-muted/20" : ""
                    }`}
                    onClick={() => toggleRead(notification.id)}
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        !notification.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm ${
                            !notification.read ? "font-semibold" : "font-medium text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && <Badge className="size-2 rounded-full p-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/60">{notification.time}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatedAccordionContent>
        </AnimatedAccordionItem>
      </AnimatedAccordion>
    </div>
  )
}

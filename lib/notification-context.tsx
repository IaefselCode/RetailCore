"use client"

import { createContext, useContext } from "react"

interface NotificationContextValue {
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  deleteNotification: () => void
  deleteAll: () => void
}

export const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
  deleteNotification: () => {},
  deleteAll: () => {},
})

export function useNotificationContext() {
  return useContext(NotificationContext)
}

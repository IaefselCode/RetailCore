"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"

export interface RealtimeNotification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface UseNotificationSocketResult {
  unreadCount: number
  latestNotification: RealtimeNotification | null
  dismissLatest: () => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  decrementCount: (by?: number) => void
}

/**
 * Connects to the Socket.IO server, joins the user's room, and listens for
 * new notifications. Returns a live unread count (incremented in realtime),
 * the most recent notification (for toast display), and methods to update
 * the counter when notifications are read/deleted.
 */
export function useNotificationSocket(
  userId: string | null | undefined,
  initialCount: number,
): UseNotificationSocketResult {
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const [latestNotification, setLatestNotification] = useState<RealtimeNotification | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const mountedRef = useRef(true)

  const dismissLatest = useCallback(() => setLatestNotification(null), [])

  const markNotificationRead = useCallback((id: string) => {
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  const decrementCount = useCallback((by = 1) => {
    setUnreadCount((c) => Math.max(0, c - by))
  }, [])

  useEffect(() => {
    mountedRef.current = true
    if (!userId) return

    const socket = io({
      path: "/api/ws",
      transports: ["websocket", "polling"],
    })
    socketRef.current = socket

    socket.on("connect", () => {
      socket.emit("register", userId)
    })

    socket.on("notification:new", (notification: RealtimeNotification) => {
      if (!mountedRef.current) return
      setUnreadCount((c) => c + 1)
      setLatestNotification(notification)
    })

    return () => {
      mountedRef.current = false
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId])

  return {
    unreadCount,
    latestNotification,
    dismissLatest,
    markNotificationRead,
    markAllNotificationsRead,
    decrementCount,
  }
}

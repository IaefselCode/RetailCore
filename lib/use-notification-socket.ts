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
}

/**
 * Connects to the Socket.IO server, joins the user's room, and listens for
 * new notifications.  Returns a live unread count (incremented in realtime)
 * and the most recent notification (for toast display).
 *
 * @param userId  - The current user's ID (from session).  Pass null to disable.
 * @param initialCount - Server-rendered unread count to hydrate from.
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

  return { unreadCount, latestNotification, dismissLatest }
}

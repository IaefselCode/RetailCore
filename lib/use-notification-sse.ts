"use client"

import { useEffect, useRef, useState, useCallback } from "react"

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
 * Polling interval (ms) — used as fallback when SSE is disconnected.
 * 30 seconds is a good balance between freshness and request cost.
 */
const POLL_INTERVAL_MS = 30_000

/**
 * SSE-based notification hook with automatic polling fallback.
 *
 * - Connects to `/api/notifications/stream` for real-time push (~3 s latency)
 * - If the SSE connection drops (Vercel timeout, network error), a
 *   `/api/notifications/unread-count` poll kicks in every 30 s as insurance
 * - When SSE reconnects, polling stops automatically
 */
export function useNotificationSocket(
  userId: string | null | undefined,
  initialCount: number,
): UseNotificationSocketResult {
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const [latestNotification, setLatestNotification] = useState<RealtimeNotification | null>(null)
  const mountedRef = useRef(true)
  const sseConnectedRef = useRef(false)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // --- Polling fallback ---------------------------------------------------
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return // already polling

    pollTimerRef.current = setInterval(async () => {
      if (!mountedRef.current) return
      try {
        const res = await fetch("/api/notifications/unread-count")
        if (res.ok) {
          const data = await res.json()
          if (mountedRef.current && typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount)
          }
        }
      } catch {
        // Network error — skip this cycle
      }
    }, POLL_INTERVAL_MS)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  // --- SSE connection -----------------------------------------------------
  useEffect(() => {
    mountedRef.current = true
    if (!userId) return

    const eventSource = new EventSource("/api/notifications/stream")

    eventSource.addEventListener("connected", () => {
      if (!mountedRef.current) return
      sseConnectedRef.current = true
      stopPolling() // SSE is working — no need for polling
    })

    eventSource.addEventListener("notification", (e) => {
      if (!mountedRef.current) return
      try {
        const notification: RealtimeNotification = JSON.parse(e.data)
        if (!notification.isRead) {
          setUnreadCount((c) => c + 1)
        }
        setLatestNotification(notification)
      } catch { /* ignore parse errors */ }
    })

    eventSource.onerror = () => {
      // SSE disconnected — start polling fallback
      sseConnectedRef.current = false
      startPolling()
      // EventSource will auto-reconnect; when it does, polling stops
    }

    return () => {
      mountedRef.current = false
      sseConnectedRef.current = false
      stopPolling()
      eventSource.close()
    }
  }, [userId, startPolling, stopPolling])

  return {
    unreadCount,
    latestNotification,
    dismissLatest,
    markNotificationRead,
    markAllNotificationsRead,
    decrementCount,
  }
}

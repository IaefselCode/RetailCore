"use client"

import { useEffect, useRef, useCallback } from "react"
import { SessionProvider, useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

const CHECK_INTERVAL_MS = 60 * 1000 // Check every 60 seconds

function SessionMonitor() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const checkingRef = useRef(false)

  const refreshSession = useCallback(async () => {
    if (checkingRef.current) return
    checkingRef.current = true

    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" })

      if (res.ok) {
        // Force NextAuth to re-read the session from the new cookie
        router.refresh()
      } else {
        // Refresh failed — token expired or revoked, force re-login
        await signOut({ callbackUrl: "/login" })
      }
    } catch {
      // Network error — don't sign out, just retry next cycle
    } finally {
      checkingRef.current = false
    }
  }, [router])

  useEffect(() => {
    if (status !== "authenticated") return

    const interval = setInterval(() => {
      // Check if session says it needs refresh
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const needsRefresh = (session as any)?.needsRefresh
      if (needsRefresh) {
        refreshSession()
      }
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [status, session, refreshSession])

  // Also check immediately on mount
  useEffect(() => {
    if (status !== "authenticated") return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const needsRefresh = (session as any)?.needsRefresh
    if (needsRefresh) {
      refreshSession()
    }
  }, [status, session, refreshSession])

  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionMonitor />
      {children}
    </SessionProvider>
  )
}

"use client"

import { useEffect, useRef, useCallback } from "react"
import { SessionProvider, useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { checkSessionStatus } from "@/lib/login-check"

const REFRESH_INTERVAL_MS = 60 * 1000 // Refresh check every 60 seconds
const SESSION_CHECK_INTERVAL_MS = 30 * 1000 // Session health check every 30 seconds
const REDIRECT_DELAY_MS = 3000 // 3 second delay before redirecting after deactivation toast

function SessionMonitor() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const checkingRef = useRef(false)
  const sessionCheckRef = useRef(false)
  const deactivationShownRef = useRef(false)

  // Refresh token rotation
  const refreshSession = useCallback(async () => {
    if (checkingRef.current) return
    checkingRef.current = true

    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" })

      if (res.ok) {
        router.refresh()
      } else {
        await signOut({ callbackUrl: "/login" })
      }
    } catch {
      // Network error - retry next cycle
    } finally {
      checkingRef.current = false
    }
  }, [router])

  // Proactive session health check - detect deactivation while logged in
  const checkSessionHealth = useCallback(async () => {
    if (sessionCheckRef.current || deactivationShownRef.current) return
    sessionCheckRef.current = true

    try {
      const result = await checkSessionStatus()

      if (!result.active && !deactivationShownRef.current) {
        deactivationShownRef.current = true

        let message = ""
        if (result.error === "account_deactivated") {
          message = result.shopName
            ? "Your account has been deactivated."
            : "Your account has been deactivated."
        } else if (result.error === "shop_deactivated") {
          message = "Your shop \"" + result.shopName + "\" has been deactivated. You will be redirected to the login page shortly."
        } else {
          message = "Your session is no longer valid."
        }

        toast.error(message, {
          duration: REDIRECT_DELAY_MS,
          description: "Redirecting to login...",
        })

        // Redirect after showing the toast
        setTimeout(async () => {
          await signOut({ callbackUrl: "/login" })
        }, REDIRECT_DELAY_MS)
      }
    } catch {
      // Silently ignore - will retry next cycle
    } finally {
      sessionCheckRef.current = false
    }
  }, [])

  // Refresh token interval
  useEffect(() => {
    if (status !== "authenticated") return

    const interval = setInterval(() => {
      const needsRefresh = (session as any)?.needsRefresh
      if (needsRefresh) {
        refreshSession()
      }
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [status, session, refreshSession])

  // Proactive session health check interval
  useEffect(() => {
    if (status !== "authenticated") return

    // Check immediately on mount
    checkSessionHealth()

    const interval = setInterval(checkSessionHealth, SESSION_CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [status, checkSessionHealth])

  // Initial refresh check on mount
  useEffect(() => {
    if (status !== "authenticated") return
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

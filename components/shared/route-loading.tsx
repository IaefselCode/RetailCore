"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { PageSkeleton } from "@/components/shared/page-skeleton"

/**
 * Route/reload loading indicator for CLIENT-side navigations.
 *
 * Next.js's `loading.tsx` only renders while the new route is being fetched
 * from the server — but dashboard links are prefetched, so navigating between
 * routes is instant and `loading.tsx` never appears. This component fills
 * that gap: it shows the same minimal centered PageSkeleton the moment a
 * client navigation starts and hides it once the new route has committed.
 *
 * Detection strategy (two complementary layers):
 *  1. Capture-phase click listener on `document` — fires BEFORE Next's Link
 *     handler, so the overlay appears the instant a link is clicked, even
 *     while the RSC data is still being fetched.
 *  2. A thin wrapper around `window.history.pushState` / `replaceState` —
 *     catches programmatic navigations (`router.push`, post-form redirects).
 *
 * Safety guards (verified against this Next version's app-router source):
 *  - The router calls `replaceState` with the SAME url on every state change
 *    (including the initial mount sync). We compare the pushed url against
 *    the current href and skip those — no flash on page load.
 *  - Next.js patches `history` itself. We only restore our wrapper if it is
 *    still the installed implementation, so we never clobber Next's.
 */
// Belt-and-suspenders for StrictMode double-mount / HMR: the identity-checked
// cleanup below is the real safety net — this flag just prevents re-installing
// while a previous mount's wrapper is still live (e.g. referenced by Next's
// own history patch).
let installed = false

// Only guards aborted/hash navigations where the pathname never changes —
// real route changes hide via the pathname effect at commit. Generous enough
// that slow pages (cold cache, heavy DB queries) keep their skeleton until
// the new route actually renders.
const FAILSAFE_MS = 5000

export function RouteLoadingIndicator() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const prevPathname = useRef(pathname)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  // Set by show(), cleared by hide(). Lets the deferred (microtask) show be
  // cancelled if the new route commits (and hide() runs) before it drains —
  // otherwise the loader would stick on fast/prefetched navigations.
  const pendingShow = useRef(false)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const show = useCallback(() => {
    if (!mountedRef.current) return
    // Defer the state update: Next's router patches history from inside its own
    // useInsertionEffect, and React forbids scheduling updates synchronously in
    // that phase ("useInsertionEffect must not schedule updates"). A microtask
    // moves the setState out of that commit-time call stack.
    pendingShow.current = true
    queueMicrotask(() => {
      if (pendingShow.current && mountedRef.current) setLoading(true)
    })
    if (hideTimer.current) clearTimeout(hideTimer.current)
    // Failsafe: only matters for navigations where the pathname never changes
    // (hash/search-param changes, aborted navigations). Real route changes
    // hide via the pathname effect long before this fires.
    hideTimer.current = setTimeout(() => {
      if (mountedRef.current) setLoading(false)
    }, FAILSAFE_MS)
  }, [])

  const hide = useCallback(() => {
    pendingShow.current = false
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
    if (mountedRef.current) setLoading(false)
  }, [])

  useEffect(() => {
    // ---- Layer 1: intercept link clicks before Next handles them ----
    const isInternalNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented) return false
      if (event.button !== 0) return false
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
      const target = event.target as Element | null
      const anchor = target?.closest?.("a[href]")
      if (!anchor) return false
      const href = anchor.getAttribute("href") ?? ""
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return false
      }
      const anchorEl = anchor as HTMLAnchorElement
      if (anchorEl.target === "_blank" || anchorEl.download) return false
      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return false
      }
      if (url.origin !== window.location.origin) return false
      // Same-page refresh clicks are covered by the Layer 2 skeletons.
      return url.pathname !== window.location.pathname
    }

    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) show()
    }
    document.addEventListener("click", onClick, true)

    // ---- Layer 2: catch programmatic history changes ----
    const isRealUrlChange = (url: unknown) => {
      if (typeof url !== "string" && !(url instanceof URL)) return true
      try {
        return new URL(String(url), window.location.href).href !== window.location.href
      } catch {
        return true
      }
    }

    const originalPush = window.history.pushState.bind(window.history)
    const originalReplace = window.history.replaceState.bind(window.history)

    const patchedPush = (data: unknown, unused: string, url?: string | URL | null) => {
      if (isRealUrlChange(url)) show()
      return originalPush(data, unused, url)
    }
    const patchedReplace = (data: unknown, unused: string, url?: string | URL | null) => {
      if (isRealUrlChange(url)) show()
      return originalReplace(data, unused, url)
    }

    // Browser back/forward — the URL is already changed when popstate fires.
    const onPopState = () => show()
    window.addEventListener("popstate", onPopState)

    if (!installed) {
      installed = true
      window.history.pushState = patchedPush
      window.history.replaceState = patchedReplace
    }

    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
      // Only restore if we're still the installed implementation — never
      // clobber Next's own history wrapper (which may sit on top of ours).
      if (installed && window.history.pushState === patchedPush) {
        window.history.pushState = originalPush
      }
      if (installed && window.history.replaceState === patchedReplace) {
        window.history.replaceState = originalReplace
      }
      installed = false
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [show])

  // Hide as soon as the new route has committed.
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      hide()
    }
  }, [pathname, hide])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40">
      <PageSkeleton />
    </div>
  )
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * Edge middleware — intentionally DB-free.
 *
 * This runs on every matched request, so it only performs cheap,
 * JWT-based gating: unauthenticated users are redirected to login and
 * logged-in users are bounced off /login. Role checks and active-user
 * checks happen in the layouts / server actions (lib/auth-utils.ts),
 * where the database is already being queried anyway.
 */
export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Public routes
  const publicPaths = ["/login", "/forgot-password", "/reset-password", "/privacy", "/terms"]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  // Unauthenticated: redirect to login
  if (!session?.user && !isPublic) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session?.user) {
    const role = session.user.role as string | undefined

    // Authenticated: redirect /login to dashboard — but not when the
    // login page is showing a deactivation notice (?error=...), which
    // requireRole() in the layouts redirects to for deactivated users.
    // Bouncing those back to the dashboard would create a redirect loop.
    if (pathname === "/login" && !req.nextUrl.searchParams.has("error")) {
      return NextResponse.redirect(
        new URL(role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard", req.url)
      )
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Exclude API routes, _next, static assets, uploads
    "/((?!api|_next|uploads|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
}

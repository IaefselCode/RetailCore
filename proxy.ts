import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Public routes
  const publicPaths = ["/login", "/forgot-password", "/reset-password"]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  // Unauthenticated: redirect to login
  if (!session?.user && !isPublic) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated: redirect /login to dashboard
  if (session?.user && pathname === "/login") {
    const role = session.user.role as string | undefined
    return NextResponse.redirect(
      new URL(role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard", req.url)
    )
  }

  // Role-based access control
  if (session?.user) {
    const role = session.user.role as string | undefined

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/employee/dashboard", req.url))
    }

    if (pathname.startsWith("/employee") && role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url))
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

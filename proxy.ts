import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  // Authenticated: check if user is still active
  if (session?.user) {
    const userId = session.user.id as string
    const role = session.user.role as string | undefined

    // Check if user account is still active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        employee: {
          select: {
            isActive: true,
            shop: { select: { isActive: true, name: true } },
          },
        },
      },
    })

    // User deleted or deactivated — force sign out
    if (!user || !user.isActive) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("error", "account_deactivated")
      return NextResponse.redirect(loginUrl)
    }

    // Employee's shop is deactivated — force sign out
    if (
      role === "EMPLOYEE" &&
      user.employee &&
      (!user.employee.isActive || !user.employee.shop.isActive)
    ) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("error", "shop_deactivated")
      loginUrl.searchParams.set("shop", user.employee.shop.name)
      return NextResponse.redirect(loginUrl)
    }

    // Authenticated: redirect /login to dashboard
    if (pathname === "/login") {
      return NextResponse.redirect(
        new URL(role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard", req.url)
      )
    }

    // Role-based access control
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

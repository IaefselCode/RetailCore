"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { cookies, headers } from "next/headers"
import { encode } from "next-auth/jwt"
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n"
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  createRefreshToken,
  DUMMY_HASH,
} from "@/lib/auth"
import { isRateLimited, rateLimit } from "@/lib/rate-limit"
import { logAuthEvent } from "@/lib/auth-log"

const LOGIN_MAX_ATTEMPTS = 10
const IP_MAX_ATTEMPTS = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export type LoginResult =
  | { success: true }
  | { success: false; error: "invalid_credentials" }
  | { success: false; error: "account_deactivated" }
  | { success: false; error: "shop_deactivated"; shopName: string }
  | { success: false; error: "rate_limited" }

/**
 * Single atomic server-side login action: verifies credentials and sets
 * the session cookie directly — bypassing NextAuth's unreliable
 * client-side signIn with the Credentials provider.
 *
 * Everything (rate limiting, activation checks, cookie) happens inside
 * this one action so the client gets an accurate result and cannot end
 * up with a valid session while showing a failure toast.
 *
 * Produces a JWT that matches the shape produced by the jwt callback
 * in lib/auth.ts so the SessionMonitor works correctly.
 */
export async function loginAction(
  email: string,
  password: string
): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const requestHeaders = await headers()
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown"
  const userAgent = requestHeaders.get("user-agent")

  const logFailure = (userId?: string) =>
    void logAuthEvent("login_failure", normalizedEmail, {
      userId: userId ?? null,
      ip,
      userAgent,
    })

  // Brute-force protection — only failed attempts consume the budget
  // (checked up front, incremented after a failed verification).
  if (
    isRateLimited(`login-email:${normalizedEmail}`, LOGIN_MAX_ATTEMPTS) ||
    (ip !== "unknown" && isRateLimited(`login-ip:${ip}`, IP_MAX_ATTEMPTS))
  ) {
    return { success: false, error: "rate_limited" }
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      isActive: true,
      role: true,
      locale: true,
      imageUrl: true,
      employee: {
        select: {
          isActive: true,
          shop: { select: { isActive: true, name: true } },
        },
      },
    },
  })

  // Constant-time protection against user enumeration
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH)
    logFailure()
    return { success: false, error: "invalid_credentials" }
  }

  // Account deactivated
  if (!user.isActive || !user.passwordHash) {
    logFailure(user.id)
    return { success: false, error: "account_deactivated" }
  }

  // Employee / shop deactivation
  if (user.role === "EMPLOYEE" && user.employee) {
    if (!user.employee.isActive) {
      logFailure(user.id)
      return { success: false, error: "account_deactivated" }
    }
    if (!user.employee.shop.isActive) {
      logFailure(user.id)
      return {
        success: false,
        error: "shop_deactivated",
        shopName: user.employee.shop.name,
      }
    }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    rateLimit(`login-email:${normalizedEmail}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)
    if (ip !== "unknown") {
      rateLimit(`login-ip:${ip}`, IP_MAX_ATTEMPTS, LOGIN_WINDOW_MS)
    }
    logFailure(user.id)
    return { success: false, error: "invalid_credentials" }
  }

  // Success — record it, then create refresh token + JWT + cookie
  void logAuthEvent("login_success", normalizedEmail, {
    userId: user.id,
    ip,
    userAgent,
  })

  const refreshToken = await createRefreshToken(user.id)

  const now = Math.floor(Date.now() / 1000)
  const token = await encode({
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
    token: {
      uid: user.id,
      role: user.role,
      locale: normalizeLocale(user.locale) ?? DEFAULT_LOCALE,
      image: user.imageUrl ?? null,
      refreshToken,
      refreshExpiresAt: Date.now() + REFRESH_TOKEN_MAX_AGE * 1000,
      iat: now,
      exp: now + ACCESS_TOKEN_MAX_AGE,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set("authjs.session-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  })

  return { success: true }
}

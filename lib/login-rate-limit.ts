"use server"

import { cookies } from "next/headers"

const COOKIE_NAME = "login_rate_limit"
const LOGIN_MAX_ATTEMPTS = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

type RateLimitData = {
  count: number
  firstAttempt: number
}

function parseCookie(raw: string | undefined): RateLimitData | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as RateLimitData
    if (typeof data.count !== "number" || typeof data.firstAttempt !== "number") return null
    return data
  } catch {
    return null
  }
}

function isWindowExpired(firstAttempt: number): boolean {
  return Date.now() - firstAttempt > LOGIN_WINDOW_MS
}

/** Peek at whether the email is rate-limited (does NOT consume an attempt). */
export async function checkLoginRateLimit(
  email: string
): Promise<{ limited: boolean }> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return { limited: false }

  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  const data = parseCookie(raw)

  if (!data || isWindowExpired(data.firstAttempt)) return { limited: false }

  return { limited: data.count >= LOGIN_MAX_ATTEMPTS }
}

/** Record a failed login attempt (increments counter in cookie). */
export async function recordLoginAttempt(): Promise<{ limited: boolean }> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  const data = parseCookie(raw)

  let newData: RateLimitData

  if (!data || isWindowExpired(data.firstAttempt)) {
    newData = { count: 1, firstAttempt: Date.now() }
  } else {
    newData = { count: data.count + 1, firstAttempt: data.firstAttempt }
  }

  cookieStore.set(COOKIE_NAME, JSON.stringify(newData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: LOGIN_WINDOW_MS / 1000,
    path: "/",
  })

  return { limited: newData.count >= LOGIN_MAX_ATTEMPTS }
}

/** Clear the rate limit counter (called on successful login). */
export async function clearLoginAttempts(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

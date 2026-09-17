"use server"

import { isRateLimited } from "@/lib/rate-limit"

const LOGIN_MAX_ATTEMPTS = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

/** Server action: peek at whether the given email is rate-limited. */
export async function checkLoginRateLimit(
  email: string
): Promise<{ limited: boolean }> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return { limited: false }
  const limited = isRateLimited(
    `email:${normalizedEmail}`,
    LOGIN_MAX_ATTEMPTS
  )
  return { limited }
}

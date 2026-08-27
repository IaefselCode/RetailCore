"use server"

import bcrypt from "bcryptjs"
import { createHash, randomBytes } from "crypto"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { isStrongPassword } from "@/lib/password-policy"
import { sendPasswordResetEmail } from "@/lib/email"
import { logAuthEvent } from "@/lib/auth-log"

const TOKEN_TTL_MS = 60 * 60 * 1000

type ActionResult = { success: boolean; message: string }

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

async function getRequestMeta() {
  const h = await headers()
  const xff = h.get("x-forwarded-for")
  return {
    ip: xff?.split(",")[0]?.trim() || "unknown",
    userAgent: h.get("user-agent"),
  }
}

/**
 * Derive the base URL from request headers so the password reset link always
 * points to the correct host, even in production on Vercel.
 */
async function getBaseUrl(): Promise<string> {
  // Explicit env override takes priority (e.g. for local dev or custom domains)
  const envUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL
  if (envUrl) return envUrl.replace(/\/$/, "")

  const h = await headers()
  const proto = h.get("x-forwarded-proto") || "https"
  const host = h.get("host")
  if (host) return `${proto}://${host}`

  // Last resort fallback
  return process.env.NODE_ENV === "development" ? "http://localhost:3000" : ""
}

export async function requestPasswordReset(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const { ip, userAgent } = await getRequestMeta()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Enter a valid email address." }
  }

  if (!rateLimit(`reset-email:${email}`, 5, 15 * 60 * 1000)) {
    return { success: false, message: "Too many requests. Try again later." }
  }
  if (!rateLimit(`reset-ip:${ip}`, 10, 15 * 60 * 1000)) {
    return { success: false, message: "Too many requests. Try again later." }
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    const token = randomBytes(32).toString("base64url")
    const tokenHash = hashToken(token)

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { email } }),
      prisma.passwordResetToken.create({
        data: {
          email,
          tokenHash,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      }),
    ])

    void logAuthEvent("password_reset_request", email, {
      userId: user.id,
      ip,
      userAgent,
    })

    const baseUrl = await getBaseUrl()
    await sendPasswordResetEmail(
      email,
      `${baseUrl}/reset-password?token=${token}`
    )
  }

  return {
    success: true,
    message:
      "If an account exists for this email, a password reset link has been sent.",
  }
}

export async function resetPasswordFromForm(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "")
  return completePasswordReset(token, null, formData)
}

export async function completePasswordReset(
  token: string,
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "")

  if (!token) {
    return { success: false, message: "This reset link is invalid or expired." }
  }
  if (!isStrongPassword(password)) {
    return {
      success: false,
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, a number and a symbol.",
    }
  }

  const tokenHash = hashToken(token)
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  })

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return { success: false, message: "This reset link is invalid or expired." }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])

  void logAuthEvent("password_reset_complete", record.email)

  return { success: true, message: "Password updated. You can now sign in." }
}

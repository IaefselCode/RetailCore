import { prisma } from "@/lib/prisma"

export type AuthEvent =
  | "login_success"
  | "login_failure"
  | "password_reset_request"
  | "password_reset_complete"
  | "admin_password_reset"
  | "password_changed"

export async function logAuthEvent(
  event: AuthEvent,
  email: string,
  opts: { userId?: string | null; ip?: string | null; userAgent?: string | null } = {}
) {
  try {
    await prisma.authLog.create({
      data: {
        event,
        email: email.toLowerCase(),
        userId: opts.userId ?? null,
        ip: opts.ip ?? null,
        userAgent: opts.userAgent ?? null,
      },
    })
  } catch (err) {
    console.error("auth log write failed:", err)
  }
}

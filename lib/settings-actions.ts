"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getSignedInRole } from "@/lib/auth-utils"
import { getRequestMeta, type ActionResult } from "@/lib/actions"
import { logAuditEvent } from "@/lib/audit-log"
import { logAuthEvent } from "@/lib/auth-log"
import { isStrongPassword } from "@/lib/password-policy"

function fail(message: string): ActionResult {
  return { success: false, message }
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim()
}

async function requireAdmin() {
  const { userId, role } = await getSignedInRole()
  if (!userId || role !== "ADMIN") return null
  return userId
}

const ALLOWED_TIMEZONES = new Set(["utc", "est", "pst", "cst", "cat", "eet", "ist", "jst", "aest", "nst"])
const ALLOWED_CURRENCIES = new Set(["usd", "eur", "gbp", "cad", "tzs"])
const ALLOWED_DATE_FORMATS = new Set(["mdy", "dmy", "ymd"])

/**
 * Get a single system setting by key. Returns the value or a default.
 */
export async function getSystemSetting(key: string, defaultValue: string = ""): Promise<string> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } })
    return row?.value ?? defaultValue
  } catch {
    return defaultValue
  }
}

export async function updateSystemSettings(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const shopName = str(formData.get("shopName"))
    const timezone = str(formData.get("timezone"))
    const currency = str(formData.get("currency"))
    const dateFormat = str(formData.get("dateFormat"))
    const sessionTimeout = str(formData.get("sessionTimeout"))

    if (shopName.length < 2) return fail("Shop name is required.")
    if (!ALLOWED_TIMEZONES.has(timezone)) return fail("Select a valid timezone.")
    if (!ALLOWED_CURRENCIES.has(currency)) return fail("Select a valid currency.")
    if (!ALLOWED_DATE_FORMATS.has(dateFormat)) return fail("Select a valid date format.")
    if (
      sessionTimeout !== "never" &&
      (!Number.isInteger(Number(sessionTimeout)) || Number(sessionTimeout) <= 0)
    ) {
      return fail("Select a valid session timeout.")
    }

    const entries: Record<string, string> = {
      shopName,
      timezone,
      currency,
      dateFormat,
      sessionTimeout,
    }

    await prisma.$transaction(
      Object.entries(entries).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )

    const meta = await getRequestMeta()
    await logAuditEvent("settings_updated", {
      actorId,
      entityType: "System",
      detail: `shopName=${shopName}, currency=${currency}, timezone=${timezone}, sessionTimeout=${sessionTimeout}`,
      ip: meta.ip,
    })

    revalidatePath("/admin/settings")
    return { success: true, message: "Settings saved successfully." }
  } catch (err) {
    console.error("updateSystemSettings failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

/**
 * Change the current employee's password.
 * Validates current password, checks strength, then updates.
 */
export async function changeEmployeePassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return fail("You must be signed in.")

  try {
    const { currentPassword, newPassword } = data

    if (!currentPassword || !newPassword) {
      return fail("Please fill in all password fields.")
    }

    if (currentPassword === newPassword) {
      return fail("New password must be different from current password.")
    }

    if (!isStrongPassword(newPassword)) {
      return fail(
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol."
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true },
    })
    if (!user || !user.passwordHash) return fail("User not found.")

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return fail("Current password is incorrect.")

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    const meta = await getRequestMeta()
    void logAuthEvent("password_changed", user.email, { userId, ip: meta.ip })
    void logAuditEvent("password_changed", {
      actorId: userId,
      entityType: "User",
      entityId: userId,
      detail: "Employee changed their own password",
      ip: meta.ip,
    })

    return { success: true, message: "Password changed successfully." }
  } catch (err) {
    console.error("changeEmployeePassword failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

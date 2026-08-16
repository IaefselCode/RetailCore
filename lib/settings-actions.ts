"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSignedInRole } from "@/lib/auth-utils"
import { getRequestMeta, type ActionResult } from "@/lib/actions"
import { logAuditEvent } from "@/lib/audit-log"

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

const ALLOWED_TIMEZONES = new Set(["utc", "est", "pst", "cst"])
const ALLOWED_CURRENCIES = new Set(["usd", "eur", "gbp", "cad"])
const ALLOWED_DATE_FORMATS = new Set(["mdy", "dmy", "ymd"])

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

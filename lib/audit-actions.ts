"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSignedInRole } from "@/lib/auth-utils"
import { csvSafe } from "@/lib/sanitize"
import type { ActionResult } from "@/lib/actions"

function fail(message: string): ActionResult {
  return { success: false, message }
}

async function requireAdmin() {
  const { userId, role } = await getSignedInRole()
  if (!userId || role !== "ADMIN") return null
  return userId
}

/** Delete a single authentication log entry. */
export async function deleteAuthLog(formData: FormData): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return fail("Missing log id.")

    await prisma.authLog.delete({ where: { id } })
    revalidatePath("/admin/audit")
    return { success: true, message: "Log entry deleted." }
  } catch (err) {
    console.error("deleteAuthLog failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

/** Delete every authentication log entry. */
export async function clearAuthLogs(): Promise<ActionResult> {
  const actorId = await requireAdmin()
  if (!actorId) return fail("You do not have permission to do that.")

  try {
    await prisma.authLog.deleteMany({})
    revalidatePath("/admin/audit")
    return { success: true, message: "All log entries cleared." }
  } catch (err) {
    console.error("clearAuthLogs failed:", err)
    return fail("Something went wrong. Please try again.")
  }
}

/**
 * Export all authentication logs as an Excel-compatible CSV string
 * (UTF-8 BOM so Excel opens it with correct encoding).
 */
export async function exportAuthLogsCsv(): Promise<string> {
  const actorId = await requireAdmin()
  if (!actorId) return ""

  const logs = await prisma.authLog.findMany({
    orderBy: { createdAt: "desc" },
  })

  const header = ["Timestamp", "Event", "Email", "IP", "User Agent"]
    .map(csvSafe)
    .join(",")
  const rows = logs.map((log) =>
    [log.createdAt.toISOString(), log.event, log.email, log.ip ?? "", log.userAgent ?? ""]
      .map(csvSafe)
      .join(",")
  )

  return "\uFEFF" + [header, ...rows].join("\n")
}

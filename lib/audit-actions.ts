"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSignedInRole } from "@/lib/auth-utils"
import type { ActionResult } from "@/lib/actions"
import ExcelJS from "exceljs"

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
 * Export all authentication logs as a styled Excel workbook (base64).
 */
export async function exportAuthLogsExcel(): Promise<string> {
  const actorId = await requireAdmin()
  if (!actorId) return ""

  const logs = await prisma.authLog.findMany({
    orderBy: { createdAt: "desc" },
  })

  if (logs.length === 0) return ""

  // Theme colors (same palette as analytics & sales exports)
  const PRIMARY = "4F46E5"
  const WHITE = "FFFFFF"
  const LIGHT_BG = "F1F5F9"
  const DANGER = "DC2626"
  const WARN = "D97706"
  const SUCCESS = "059669"
  const INFO = "2563EB"

  const wb = new ExcelJS.Workbook()
  wb.creator = "RetailCore"
  wb.created = new Date()

  const ws = wb.addWorksheet("Auth Logs")

  const headers = ["Timestamp", "Event", "Email", "IP Address", "User Agent"]
  const colWidths = [22, 18, 30, 18, 40]

  // Title row
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  ws.mergeCells(1, 1, 1, headers.length)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = `Authentication Logs — ${dateStr}`
  titleCell.font = { bold: true, size: 14, color: { argb: `FF${PRIMARY}` } } as ExcelJS.Font
  titleCell.alignment = { vertical: "middle" }
  ws.getRow(1).height = 30

  // Header row
  headers.forEach((h, ci) => {
    const cell = ws.getCell(2, ci + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: `FF${WHITE}` }, size: 11 } as ExcelJS.Font
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${PRIMARY}` } }
    cell.alignment = { horizontal: "center", vertical: "middle" }
    cell.border = {
      top: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
      left: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
      right: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
    }
  })
  ws.getRow(2).height = 24

  // Event → color mapping for the event cell
  const eventColors: Record<string, string> = {
    LOGIN: SUCCESS,
    LOGOUT: WARN,
    LOGIN_FAILED: DANGER,
    PASSWORD_RESET: INFO,
  }

  // Data rows
  logs.forEach((log, i) => {
    const rowNum = i + 3
    const values: (string | number)[] = [
      log.createdAt.toISOString().replace("T", " ").slice(0, 19),
      log.event.replace("_", " "),
      log.email,
      log.ip ?? "—",
      log.userAgent ?? "—",
    ]
    values.forEach((v, ci) => {
      const cell = ws.getCell(rowNum, ci + 1)
      cell.value = v
      cell.border = {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
      }
      // Alternate row shading
      if (i % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${LIGHT_BG}` } }
      }
    })
    // Color the event cell based on event type
    const eventCell = ws.getCell(rowNum, 2)
    const rawEvent = log.event.toUpperCase()
    const eventColor = eventColors[rawEvent] ?? PRIMARY
    eventCell.font = { bold: true, color: { argb: `FF${eventColor}` } } as ExcelJS.Font
  })

  // Auto-fit column widths
  headers.forEach((_, ci) => {
    ws.getColumn(ci + 1).width = colWidths[ci]
  })

  // Return as base64
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf).toString("base64")
}

import { prisma } from "@/lib/prisma"

export type AuditEvent =
  | "shop_created"
  | "shop_updated"
  | "shop_deactivated"
  | "shop_activated"
  | "shop_deleted"
  | "employee_created"
  | "employee_updated"
  | "employee_deactivated"
  | "employee_activated"
  | "employee_deleted"
  | "product_created"
  | "product_updated"
  | "product_activated"
  | "product_deactivated"
  | "product_deleted"
  | "stock_purchased"
  | "stock_distributed"
  | "stock_levels_updated"
  | "sale_recorded"
  | "sale_voided"
  | "settings_updated"

export async function logAuditEvent(
  event: AuditEvent,
  opts: {
    actorId?: string | null
    entityType?: string
    entityId?: string
    detail?: string
    ip?: string | null
  } = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        event,
        actorId: opts.actorId ?? null,
        entityType: opts.entityType ?? null,
        entityId: opts.entityId ?? null,
        detail: opts.detail ?? null,
        ip: opts.ip ?? null,
      },
    })
  } catch (err) {
    console.error("audit log write failed:", err)
  }
}

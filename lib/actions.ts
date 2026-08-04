import { headers } from "next/headers"

export type ActionResult = { success: boolean; message: string }

export async function getRequestMeta() {
  const h = await headers()
  const xff = h.get("x-forwarded-for")
  return {
    ip: xff?.split(",")[0]?.trim() || "unknown",
    userAgent: h.get("user-agent"),
  }
}

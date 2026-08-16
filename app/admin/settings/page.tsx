import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { AdminSettingsForm } from "@/components/admin/admin-settings-form"

export const metadata = { title: "Settings | RetailCore" }

export default async function SettingsPage() {
  await requireRole("ADMIN")

  const rows = await prisma.systemSetting.findMany()
  const map = new Map(rows.map((r) => [r.key, r.value]))

  return (
    <AdminSettingsForm
      initial={{
        shopName: map.get("shopName") ?? "RetailCore Store",
        timezone: map.get("timezone") ?? "utc",
        currency: map.get("currency") ?? "usd",
        dateFormat: map.get("dateFormat") ?? "mdy",
        sessionTimeout: map.get("sessionTimeout") ?? "30",
      }}
    />
  )
}

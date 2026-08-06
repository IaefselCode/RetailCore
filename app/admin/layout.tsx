import { requireRole } from "@/lib/auth-utils"
import { AdminShell } from "@/components/shared/admin-shell"
import { NotificationBadge } from "@/components/shared/notification-badge"
import { RouteLoadingIndicator } from "@/components/shared/route-loading"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN")

  return (
    <AdminShell notificationSlot={<NotificationBadge href="/admin/notifications" />}>
      {children}
      <RouteLoadingIndicator />
    </AdminShell>
  )
}

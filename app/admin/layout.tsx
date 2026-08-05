import { Suspense } from "react"
import { requireRole } from "@/lib/auth-utils"
import { AdminShell } from "@/components/shared/admin-shell"
import {
  NotificationBadge,
  NotificationBellSkeleton,
} from "@/components/shared/notification-badge"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN")

  return (
    <AdminShell
      notificationSlot={
        <Suspense fallback={<NotificationBellSkeleton href="/admin/notifications" />}>
          <NotificationBadge href="/admin/notifications" />
        </Suspense>
      }
    >
      {children}
    </AdminShell>
  )
}

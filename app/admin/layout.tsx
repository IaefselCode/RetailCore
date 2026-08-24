import { requireRole } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AdminShell } from "@/components/shared/admin-shell"
import { NotificationBadge } from "@/components/shared/notification-badge"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN")
  const session = await auth()
  const userId = session?.user?.id ?? null
  const initialCount = userId
    ? await prisma.notification.count({ where: { userId, isRead: false } })
    : 0

  return (
    <AdminShell notificationSlot={<NotificationBadge userId={userId} initialCount={initialCount} href="/admin/notifications" />}>
      {children}
    </AdminShell>
  )
}

import { requireRole } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EmployeeShell } from "@/components/shared/employee-shell"
import { NotificationBadge } from "@/components/shared/notification-badge"

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  await requireRole("EMPLOYEE")
  const session = await auth()
  const userId = session?.user?.id ?? null
  const initialCount = userId
    ? await prisma.notification.count({ where: { userId, isRead: false } })
    : 0

  return (
    <EmployeeShell notificationSlot={<NotificationBadge userId={userId} initialCount={initialCount} href="/employee/notifications" />}>
      {children}
    </EmployeeShell>
  )
}

import { requireRole } from "@/lib/auth-utils"
import { EmployeeShell } from "@/components/shared/employee-shell"
import { NotificationBadge } from "@/components/shared/notification-badge"
import { RouteLoadingIndicator } from "@/components/shared/route-loading"

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  await requireRole("EMPLOYEE")

  return (
    <EmployeeShell notificationSlot={<NotificationBadge href="/employee/notifications" />}>
      {children}
      <RouteLoadingIndicator />
    </EmployeeShell>
  )
}

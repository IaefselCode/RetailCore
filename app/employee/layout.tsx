import { Suspense } from "react"
import { requireRole } from "@/lib/auth-utils"
import { EmployeeShell } from "@/components/shared/employee-shell"
import {
  NotificationBadge,
  NotificationBellSkeleton,
} from "@/components/shared/notification-badge"

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  await requireRole("EMPLOYEE")

  return (
    <EmployeeShell
      notificationSlot={
        <Suspense fallback={<NotificationBellSkeleton href="/employee/notifications" />}>
          <NotificationBadge href="/employee/notifications" />
        </Suspense>
      }
    >
      {children}
    </EmployeeShell>
  )
}

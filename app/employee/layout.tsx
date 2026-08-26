import { requireRole } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EmployeeShell } from "@/components/shared/employee-shell"
import { NotificationProvider } from "@/components/shared/notification-provider"
import { NotificationBell } from "@/components/shared/notification-bell"
import { CurrencyProvider } from "@/components/providers/currency-provider"
import { getSystemCurrency } from "@/lib/money"

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  await requireRole("EMPLOYEE")
  const session = await auth()
  const userId = session?.user?.id ?? null
  const initialCount = userId
    ? await prisma.notification.count({ where: { userId, isRead: false } })
    : 0
  const currency = await getSystemCurrency()

  return (
    <CurrencyProvider currency={currency}>
      <NotificationProvider userId={userId} initialCount={initialCount}>
        <EmployeeShell notificationSlot={<NotificationBell href="/employee/notifications" size="icon-sm" />}>
          {children}
        </EmployeeShell>
      </NotificationProvider>
    </CurrencyProvider>
  )
}

import { requireRole } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AdminShell } from "@/components/shared/admin-shell"
import { NotificationProvider } from "@/components/shared/notification-provider"
import { NotificationBell } from "@/components/shared/notification-bell"
import { CurrencyProvider } from "@/components/providers/currency-provider"
import { DateFormatProvider } from "@/components/providers/date-format-provider"
import { getSystemCurrency } from "@/lib/money"
import { getDateFormat } from "@/lib/date-format"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN")
  const session = await auth()
  const userId = session?.user?.id ?? null
  const initialCount = userId
    ? await prisma.notification.count({ where: { userId, isRead: false } })
    : 0
  const currency = await getSystemCurrency()
  const dateFormat = await getDateFormat()

  return (
    <DateFormatProvider dateFormat={dateFormat}>
    <CurrencyProvider currency={currency}>
      <NotificationProvider userId={userId} initialCount={initialCount}>
        <AdminShell notificationSlot={<NotificationBell href="/admin/notifications" size="icon-sm" />}>
          {children}
        </AdminShell>
      </NotificationProvider>
    </CurrencyProvider>
    </DateFormatProvider>
  )
}

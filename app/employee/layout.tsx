import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { EmployeeShell } from "@/components/shared/employee-shell"

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  await requireRole("EMPLOYEE")

  const session = await auth()
  const userId = session?.user?.id
  const unreadCount = userId
    ? await prisma.notification.count({ where: { userId, isRead: false } })
    : 0

  return <EmployeeShell unreadCount={unreadCount}>{children}</EmployeeShell>
}

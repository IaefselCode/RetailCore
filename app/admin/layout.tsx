import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { AdminShell } from "@/components/shared/admin-shell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN")

  const session = await auth()
  const userId = session?.user?.id
  const unreadCount = userId
    ? await prisma.notification.count({ where: { userId, isRead: false } })
    : 0

  return <AdminShell unreadCount={unreadCount}>{children}</AdminShell>
}

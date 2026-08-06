import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NotificationBell } from "@/components/shared/notification-bell"

export async function NotificationBadge({
  href,
  size = "icon-sm",
}: {
  href: string
  size?: "icon" | "icon-sm"
}) {
  const session = await auth()
  const count = session?.user?.id
    ? await prisma.notification.count({ where: { userId: session.user.id, isRead: false } })
    : 0

  return <NotificationBell count={count} href={href} size={size} />
}

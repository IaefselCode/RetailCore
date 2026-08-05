import Link from "next/link"
import { Bell } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationBell } from "@/components/shared/notification-bell"

export async function NotificationBadge({
  href,
  size = "icon",
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

export function NotificationBellSkeleton({
  href,
  size = "icon",
}: {
  href: string
  size?: "icon" | "icon-sm"
}) {
  return (
    <Link href={href}>
      <AnimateButton variant="ghost" size={size} className="relative" aria-label="Notifications">
        <Bell className="size-5" />
        <Skeleton className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full" />
      </AnimateButton>
    </Link>
  )
}

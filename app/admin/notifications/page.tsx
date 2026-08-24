import { Suspense } from "react"
import { requireRole } from "@/lib/auth-utils"
import { getNotifications } from "@/lib/notification-actions"
import { NotificationList } from "@/components/admin/notification-list"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Notifications | RetailCore" }

export default async function NotificationsPage() {
  await requireRole("ADMIN")

  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsContent />
    </Suspense>
  )
}

async function NotificationsContent() {
  const notifications = await getNotifications()
  return <NotificationList initialNotifications={notifications} />
}

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-lg border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 border-b p-4 last:border-b-0">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

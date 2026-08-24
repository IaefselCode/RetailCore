import { Suspense } from "react"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { getNotifications } from "@/lib/notification-actions"
import { EmployeeNotificationList } from "@/components/employee/notification-list"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Notifications | RetailCore" }

export default async function EmployeeNotificationsPage() {
  await requireEmployeeContext()

  return (
    <Suspense fallback={<EmployeeNotificationsSkeleton />}>
      <EmployeeNotificationsContent />
    </Suspense>
  )
}

async function EmployeeNotificationsContent() {
  const notifications = await getNotifications()
  return <EmployeeNotificationList initialNotifications={notifications} />
}

function EmployeeNotificationsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonNotifications } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <SkeletonNotifications groups={2} />
    </div>
  )
}
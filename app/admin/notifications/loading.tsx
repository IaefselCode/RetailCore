import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonNotifications } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-44" />
        </div>
      </div>

      <SkeletonNotifications groups={2} />
    </div>
  )
}
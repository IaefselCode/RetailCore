import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonAvatar, SkeletonKpiGrid, SkeletonTable, SkeletonTabs } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <SkeletonAvatar className="size-14" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <SkeletonTabs count={3} />

      <SkeletonKpiGrid count={3} />

      <SkeletonTable rows={5} cols={7} />
    </div>
  )
}

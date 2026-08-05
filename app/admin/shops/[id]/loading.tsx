import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonKpiGrid, SkeletonTable } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <SkeletonKpiGrid count={4} />

      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <SkeletonTable rows={4} cols={4} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <SkeletonTable rows={4} cols={7} />
        </div>
      </div>
    </div>
  )
}

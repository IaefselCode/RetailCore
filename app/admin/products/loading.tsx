import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonKpiGrid, SkeletonTable } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>

      <SkeletonKpiGrid count={3} />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full sm:max-w-sm" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <SkeletonTable rows={6} cols={7} />
      </div>
    </div>
  )
}

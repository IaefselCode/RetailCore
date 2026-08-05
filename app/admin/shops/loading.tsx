import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonKpiGrid, SkeletonTable } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <SkeletonKpiGrid count={3} />

      <div className="space-y-3">
        <Skeleton className="h-9 w-full sm:max-w-sm" />
        <SkeletonTable rows={6} cols={6} />
        <div className="flex justify-end">
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
    </div>
  )
}

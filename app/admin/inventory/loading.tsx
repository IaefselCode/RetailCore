import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonKpiGrid, SkeletonTable } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
      </div>

      <SkeletonKpiGrid count={4} />

      <SkeletonTable rows={6} cols={6} />
    </div>
  )
}
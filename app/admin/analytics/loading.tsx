import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonKpiGrid, SkeletonTable } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <SkeletonKpiGrid count={4} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-80 rounded-lg lg:col-span-2" />
        <Skeleton className="h-80 rounded-lg" />
      </div>

      <SkeletonTable rows={5} cols={4} />
    </div>
  )
}
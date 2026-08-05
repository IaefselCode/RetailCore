import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonTable } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-48" />
      </div>

      <Skeleton className="h-9 w-full sm:max-w-sm" />

      <SkeletonTable rows={6} cols={6} />
    </div>
  )
}
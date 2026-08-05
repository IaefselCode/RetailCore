import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonTable } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="h-5 w-28" />

      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}

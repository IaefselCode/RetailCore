import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDetail, SkeletonTable } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <SkeletonDetail icon kpis={4} backButton>
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
    </SkeletonDetail>
  )
}

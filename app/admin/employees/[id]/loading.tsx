import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDetail, SkeletonTable } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <SkeletonDetail avatar tabs={3} kpis={3} backButton>
      <div className="space-y-3 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <SkeletonTable rows={5} cols={7} />
      </div>
    </SkeletonDetail>
  )
}

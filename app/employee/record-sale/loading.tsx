import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonPos } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>

      <SkeletonPos />
    </div>
  )
}

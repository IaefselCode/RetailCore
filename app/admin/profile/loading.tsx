import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonProfile } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-32" />
      <SkeletonProfile />
    </div>
  )
}
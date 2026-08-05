import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonForm, SkeletonTabs } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-44" />
      </div>

      <SkeletonTabs count={4} />

      <SkeletonForm fields={2} rows={1} />

      <div className="flex justify-end">
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  )
}

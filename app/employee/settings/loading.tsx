import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonSwitchRows } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="space-y-4 rounded-lg p-6">
        <div className="space-y-1">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-56" />
        </div>
        <SkeletonSwitchRows rows={3} />
      </div>

      <div className="space-y-4 rounded-lg p-6">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>

      <div className="space-y-4 rounded-lg p-6">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonTable } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-7 w-48" />

      <div className="space-y-4 rounded-lg p-6">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <div className="space-y-4 rounded-lg p-6">
        <Skeleton className="h-5 w-24" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
        <SkeletonTable rows={3} cols={5} />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
    </div>
  )
}

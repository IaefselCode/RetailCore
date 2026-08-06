import { Skeleton } from "@/components/ui/skeleton"

/**
 * Layer 1 — the single, minimal route/reload skeleton.
 *
 * Every route's loading.tsx renders this component and nothing else.
 * It is intentionally tiny and generic: a small pulsing indicator centered
 * in the content area that simply communicates "this page is loading".
 * All real loading feedback belongs to the Layer 2 skeletons that sit
 * inside the data components themselves.
 */
export function PageSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

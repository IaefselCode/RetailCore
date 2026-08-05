import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function SkeletonText({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full", className)} />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn("size-12 rounded-full", className)} />
}

export function SkeletonCard({
  className,
  title,
}: {
  className?: string
  title?: boolean
}) {
  return (
    <div className={cn("space-y-3 rounded-lg p-4", className)}>
      {title && <Skeleton className="h-5 w-2/5" />}
      <SkeletonText lines={3} />
    </div>
  )
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-7 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({
  rows = 6,
  cols = 5,
  toolbar,
}: {
  rows?: number
  cols?: number
  toolbar?: boolean
}) {
  return (
    <div className="space-y-3">
      {toolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full sm:max-w-xs" />
          <Skeleton className="h-9 w-36" />
        </div>
      )}
      <div className="space-y-3 rounded-lg p-4">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonForm({ fields = 4, rows = 2 }: { fields?: number; rows?: number }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-5 rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        {rows === 2 && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        )}
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  )
}

export function SkeletonWizard({ steps = 3 }: { steps?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: steps }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-28 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="space-y-5 rounded-lg p-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonNotifications({ groups = 2 }: { groups?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: groups }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-lg p-4">
          <Skeleton className="h-6 w-20" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex items-start gap-3 py-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full max-w-sm" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-lg p-6">
        <SkeletonAvatar className="size-16" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <SkeletonTabs count={3} />
      <div className="space-y-5 rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  )
}

export function SkeletonTabs({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-md" />
      ))}
    </div>
  )
}

export function SkeletonSwitchRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-4 rounded" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonDetail({
  avatar = false,
  icon = false,
  backButton = true,
  tabs = 0,
  kpis = 0,
  children,
}: {
  avatar?: boolean
  icon?: boolean
  backButton?: boolean
  tabs?: number
  kpis?: number
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {avatar && <SkeletonAvatar className="size-14" />}
          {icon && <Skeleton className="size-12 rounded-lg" />}
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {backButton && <Skeleton className="h-9 w-36" />}
      </div>

      {tabs > 0 && <SkeletonTabs count={tabs} />}

      {kpis > 0 && <SkeletonKpiGrid count={kpis} />}

      {children}
    </div>
  )
}

export function SkeletonPos() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-lg p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  )
}


export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <SkeletonKpiGrid count={4} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-5 w-36" />
          <SkeletonTable rows={5} cols={6} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonEmployeeDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>

      <SkeletonKpiGrid count={4} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-44" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-lg p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-52" />
          <SkeletonTable rows={5} cols={4} />
        </div>
      </div>
    </div>
  )
}


export function SkeletonStat({ className }: { className?: string }) {
  return <Skeleton className={cn("h-7 w-24", className)} />
}


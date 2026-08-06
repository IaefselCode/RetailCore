import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * Layer 2 — small, reusable skeletons placed exactly where data loads
 * (table bodies, KPI values, lists, card grids, forms). Page chrome such as
 * headers, breadcrumbs, and buttons is never duplicated here.
 */

/** Placeholder for a KPI/numeric value inside a stat card. */
export function SkeletonStat({ className }: { className?: string }) {
  return <Skeleton className={cn("h-7 w-24", className)} />
}

/** Search input placeholder (search icon overlay + input bar). */
export function SearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  )
}

/**
 * Skeleton <TableRow>s to drop into a real <TableBody>.
 * `columns` is either a count or an array of Tailwind width classes
 * (e.g. ["w-32", "w-20"]) so rows mirror the real column widths.
 */
export function TableRowsSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number
  columns?: number | string[]
}) {
  const widths =
    typeof columns === "number" ? Array.from({ length: columns }, () => undefined) : columns
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {widths.map((w, c) => (
            <TableCell key={c}>
              <Skeleton className={cn("h-4", w)} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

/**
 * Standalone skeleton table (Card + optional header + body rows).
 * Use as a Suspense fallback when the real table's chrome lives inside a
 * client component (e.g. EmployeesTable, ShopsTable, ProductsTable).
 */
export function SkeletonTable({
  rows = 6,
  columns = 5,
  headers,
}: {
  rows?: number
  columns?: number | string[]
  headers?: string[]
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            {headers && headers.length > 0 && (
              <TableHeader>
                <TableRow>
                  {headers.map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            )}
            <TableBody>
              <TableRowsSkeleton rows={rows} columns={columns} />
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/** Generic list rows (low-stock lists, activity feeds, notifications). */
export function ListSkeleton({
  rows = 4,
  icon = false,
  className,
}: {
  rows?: number
  icon?: boolean
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={icon ? "flex items-start gap-3" : "flex items-center justify-between gap-3"}
        >
          {icon && <Skeleton className="size-9 shrink-0 rounded-lg" />}
          <div className={cn("min-w-0 space-y-1.5", icon && "flex-1")}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          {!icon && <Skeleton className="h-5 w-14 shrink-0" />}
        </div>
      ))}
    </div>
  )
}

/** Product card grid placeholder. */
export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** Simple form placeholder (add/edit pages). */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-5 rounded-lg border p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  )
}

/** Multi-step wizard placeholder (add product, create shop). */
export function WizardSkeleton({ steps = 3 }: { steps?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: steps }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-28 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="space-y-5 rounded-lg border p-6">
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

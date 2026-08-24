import { type ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import {
  constructTable,
  createColumnHelper,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from "@tanstack/table-core"
import { storeReactivityBindings } from "@tanstack/table-core/store-reactivity-bindings"
import { flexRender } from "@tanstack/react-table"
import Link from "next/link"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * TanStack Table v9 features for server-side rendering.
 * `constructTable` is framework-neutral (no hooks), so it works inside
 * RSC — the model is built once per render and the shadcn chrome renders it.
 */
export const serverFeatures = tableFeatures({
  coreReactivityFeature: storeReactivityBindings(),
})

export type ServerFeatures = typeof serverFeatures

export function createServerColumnHelper<T extends RowData>() {
  return createColumnHelper<ServerFeatures, T>()
}

export interface ServerTableProps<T extends RowData> {
  data: T[]
  columns: ColumnDef<ServerFeatures, T>[]
  getRowId?: (row: T) => string
  /** Message shown when there are no rows. */
  empty?: ReactNode
  /** Prepend a "#" column numbering the rows. */
  numbered?: boolean
  /**
   * Render only the `<TableRow>`s (no table chrome). Use when the page
   * already provides its own `<Table>`/`<TableHeader>`/`<TableBody>` and
   * only the data rows stream in (e.g. inside a Suspense within a tbody).
   */
  bodyOnly?: boolean
  className?: string
  /** Enable pagination footer. Defaults to 10 rows per page. */
  pageSize?: number
  /** Current 1-indexed page number. */
  page?: number
  /** Total number of rows across all pages. Defaults to data.length. */
  total?: number
  /**
   * Build the href for a given page number. Used to preserve existing
   * URL search params (filters, etc.) across pagination links.
   */
  buildPageHref?: (page: number) => string
}

/**
 * Server-component table built on TanStack Table v9 (`constructTable`).
 * Use for read-only tables rendered by RSC pages.
 */
export async function ServerTable<T extends RowData>({
  data,
  columns,
  getRowId,
  empty,
  numbered = false,
  bodyOnly = false,
  className,
  pageSize = 10,
  page = 1,
  total,
  buildPageHref,
}: ServerTableProps<T>) {
  // Server components can't call the client useTranslations hook, so resolve
  // the header label from the request scope instead (only when needed).
  const t = numbered ? await getTranslations("common") : null

  const numberColumn: ColumnDef<ServerFeatures, T> = {
    id: "__index",
    header: t?.("no") ?? "No.",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{row.index + 1}</span>
    ),
  }

  const displayColumns = numbered ? [numberColumn, ...columns] : columns
  const totalRows = total ?? data.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const pageData = data.slice(start, start + pageSize)

  const table = constructTable<ServerFeatures, T>({
    features: serverFeatures,
    columns: displayColumns,
    data: pageData,
    getRowId,
  })

  const rows = table.getRowModel().rows
  const headerGroups = table.getHeaderGroups()

  const rowNodes =
    rows.length === 0 ? (
      <TableRow>
        <TableCell
          colSpan={displayColumns.length}
          className="py-8 text-center text-sm text-muted-foreground"
        >
          {empty}
        </TableCell>
      </TableRow>
    ) : (
      rows.map((row) => (
        <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
          {row.getAllCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))
    )

  const showPagination = totalRows > pageSize
  const hrefBuilder = buildPageHref ?? ((p: number) => (p > 1 ? `?page=${p}` : "."))

  const paginationFooter = showPagination ? (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {start + 1}–{Math.min(start + pageData.length, totalRows)} {t?.("of") ?? "of"}{" "}
        {totalRows}
      </p>
      <div className="flex items-center gap-1">
        <AnimateButton
          asChild
          variant="outline"
          size="icon-sm"
          disabled={safePage <= 1}
          aria-label="Previous page"
        >
          <Link href={hrefBuilder(safePage - 1)} scroll={false}>
            <ChevronLeft className="size-4" />
          </Link>
        </AnimateButton>
        <span className="px-3 text-sm tabular-nums">
          {safePage} / {totalPages}
        </span>
        <AnimateButton
          asChild
          variant="outline"
          size="icon-sm"
          disabled={safePage >= totalPages}
          aria-label="Next page"
        >
          <Link href={hrefBuilder(safePage + 1)} scroll={false}>
            <ChevronRight className="size-4" />
          </Link>
        </AnimateButton>
      </div>
    </div>
  ) : null

  if (bodyOnly) {
    return <>{rowNodes}</>
  }

  return (
    <div className={cn("rounded-lg border", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {headerGroups.map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{rowNodes}</TableBody>
        </Table>
      </div>
      {paginationFooter}
    </div>
  )
}

"use client"

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import {
  createTableHook,
  tableFeatures,
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equals,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"
import type { Table as CoreTable } from "@tanstack/table-core"
import { Search, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { AnimateButton } from "@/components/ui/animate-button"
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
 * Shared TanStack Table v9 client infrastructure.
 *
 * Features are registered once here (sorting, column + global filtering,
 * pagination) and every interactive table in the app is built on
 * `useAppTable` + `createAppColumnHelper`.
 */
export const dataFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, basic: sortFn_basic },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
    equals: filterFn_equals,
  },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})

export type DataFeatures = typeof dataFeatures

export const { createAppColumnHelper, useAppTable, useTableContext } = createTableHook({
  features: dataFeatures,
})

export type AppColumnDef<T extends RowData> = ColumnDef<DataFeatures, T>

export interface DataTableProps<T extends RowData> {
  data: T[]
  columns: AppColumnDef<T>[]
  getRowId?: (row: T, index: number) => string
  /** Show a global search input bound to the table's global filter. */
  searchable?: boolean
  searchPlaceholder?: string
  /** Prepend a "#" column numbering the visible rows (continuous across pages). */
  numbered?: boolean
  /** Extra toolbar controls rendered next to the search input (filters etc).
   * Receives the table instance so filters can call `table.getColumn(id)`. */
  toolbar?: ReactNode | ((table: CoreTable<DataFeatures, T>) => ReactNode)
  /** Message shown when there are no rows after filtering. */
  empty?: ReactNode
  /** Enable client-side pagination footer. */
  pagination?: boolean
  pageSize?: number
  initialSorting?: SortingState
  initialGlobalFilter?: string
  initialColumnFilters?: { id: string; value: unknown }[]
  /** When set, the caller can switch between table and card rendering. */
  viewMode?: "table" | "cards"
  /** Renders one card per row (used when viewMode === "cards"). */
  renderCard?: (row: T) => ReactNode
  /** Grid classes for the card layout (defaults to a responsive 4-col grid). */
  cardGridClassName?: string
  className?: string
  /** Skip the built-in Card wrapper — use when the caller already wraps in a Card. */
  cardless?: boolean
}

/**
 * Presentational data table: search bar, sortable headers, optional
 * pagination, and the shadcn table chrome. Table state lives entirely in
 * TanStack via `useAppTable`.
 */
const SEARCH_DEBOUNCE_MS = 250
/** Minimum time the "searching…" spinner stays visible so it is perceptible. */
const SEARCH_MIN_VISIBLE_MS = 350

/** Page indexes around the current page, with "…" for gaps (max 7 entries). */
function getPageItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const items: (number | "…")[] = []
  const start = Math.max(0, Math.min(current - 2, total - 5))
  const end = Math.min(total - 1, start + 4)
  if (start > 0) items.push(0)
  if (start > 1) items.push("…")
  for (let i = start; i <= end; i++) items.push(i)
  if (end < total - 2) items.push("…")
  if (end < total - 1) items.push(total - 1)
  return items
}

export function DataTable<T extends RowData>({
  data,
  columns,
  getRowId,
  searchable = false,
  searchPlaceholder,
  numbered = false,
  toolbar,
  empty,
  pagination = false,
  pageSize = 10,
  initialSorting,
  initialGlobalFilter,
  initialColumnFilters,
  viewMode = "table",
  renderCard,
  cardGridClassName,
  className,
  cardless = false,
}: DataTableProps<T>) {
  const t = useTranslations("common")
  const [searchValue, setSearchValue] = useState((initialGlobalFilter as string) ?? "")
  const [isSearching, setIsSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchMinTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
      if (searchMinTimer.current) clearTimeout(searchMinTimer.current)
    },
    []
  )

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    setIsSearching(true)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (searchMinTimer.current) clearTimeout(searchMinTimer.current)
    // Re-run the filter after the debounce; keep the spinner up long enough
    // to be noticeable when filtering a large dataset takes a moment.
    searchMinTimer.current = setTimeout(() => setIsSearching(false), SEARCH_MIN_VISIBLE_MS)
    searchTimer.current = setTimeout(() => {
      table.setGlobalFilter(value)
    }, SEARCH_DEBOUNCE_MS)
  }

  const numberColumn: AppColumnDef<T> = {
    id: "__index",
    header: t("no"),
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{row.index + 1}</span>
    ),
  }

  const displayColumns = numbered ? [numberColumn, ...columns] : columns

  const table = useAppTable({
    data,
    columns: displayColumns,
    getRowId,
    initialState: {
      // Always initialize sorting to an array — the feature default `[]` is
      // overwritten when `initialSorting` is undefined, and TanStack v9's
      // toggleSorting updater does `old.findIndex(...)` and crashes on
      // undefined ("Cannot read properties of undefined (reading 'findIndex')").
      sorting: initialSorting ?? [],
      globalFilter: initialGlobalFilter,
      // Always initialize columnFilters to an array — TanStack v9's
      // setFilterValue does `old.find(...)` and crashes when it's undefined.
      columnFilters: initialColumnFilters ?? [],
      pagination: { pageIndex: 0, pageSize },
    },
    getColumnCanGlobalFilter: (column) =>
      column.id !== "actions" && column.id !== "__index",
  })

  const rows = table.getRowModel().rows

  return (
    <div className={cn("space-y-4", className)}>
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {searchable && (
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-8 pr-8"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-busy={isSearching}
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          )}
          {typeof toolbar === "function" ? toolbar(table) : toolbar}
        </div>
      )}

      {viewMode === "cards" && renderCard ? (
        rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              cardGridClassName
            )}
          >
            {rows.map((row) => (
              <Fragment key={row.id}>{renderCard(row.original)}</Fragment>
            ))}
          </div>
        )
      ) : (
        cardless ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id}>
                    {group.headers.map((header) => {
                      const canSort = header.column.getCanSort()
                      const sorted = header.column.getIsSorted()
                      return (
                        <TableHead
                          key={header.id}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          className={cn(canSort && "cursor-pointer select-none")}
                        >
                          {header.isPlaceholder ? null : (
                            <div className="flex items-center gap-1.5">
                              <table.FlexRender header={header} />
                              {canSort &&
                                (sorted === "asc" ? (
                                  <ArrowUp className="size-3.5" />
                                ) : sorted === "desc" ? (
                                  <ArrowDown className="size-3.5" />
                                ) : (
                                  <ArrowUpDown className="size-3.5 opacity-50" />
                                ))}
                            </div>
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={displayColumns.length}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      {empty}
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((group) => (
                      <TableRow key={group.id}>
                        {group.headers.map((header) => {
                          const canSort = header.column.getCanSort()
                          const sorted = header.column.getIsSorted()
                          return (
                            <TableHead
                              key={header.id}
                              onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                              className={cn(canSort && "cursor-pointer select-none")}
                            >
                              {header.isPlaceholder ? null : (
                                <div className="flex items-center gap-1.5">
                                  <table.FlexRender header={header} />
                                  {canSort &&
                                    (sorted === "asc" ? (
                                      <ArrowUp className="size-3.5" />
                                    ) : sorted === "desc" ? (
                                      <ArrowDown className="size-3.5" />
                                    ) : (
                                      <ArrowUpDown className="size-3.5 opacity-50" />
                                    ))}
                                </div>
                              )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={displayColumns.length}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          {empty}
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((row) => (
                      <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                        {row.getAllCells().map((cell) => (
                          <TableCell key={cell.id}>
                            <table.FlexRender cell={cell} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {pagination && table.getRowCount() > pageSize && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {table.state.pagination.pageIndex * pageSize + 1}–
            {Math.min(
              (table.state.pagination.pageIndex + 1) * pageSize,
              table.getRowCount()
            )}{" "}
            / {table.getRowCount()}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <AnimateButton
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </AnimateButton>
            {getPageItems(
              table.state.pagination.pageIndex,
              table.getPageCount()
            ).map((page, i) =>
              page === "…" ? (
                <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">
                  …
                </span>
              ) : (
                <AnimateButton
                  key={page}
                  variant={page === table.state.pagination.pageIndex ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => table.setPageIndex(page)}
                  aria-label={`Page ${page + 1}`}
                  aria-current={page === table.state.pagination.pageIndex ? "page" : undefined}
                >
                  {page + 1}
                </AnimateButton>
              )
            )}
            <AnimateButton
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </AnimateButton>
          </div>
        </div>
      )}
    </div>
  )
}

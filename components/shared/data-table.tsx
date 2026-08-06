"use client"

import { type ReactNode } from "react"
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
import { Search, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
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
  className?: string
}

/**
 * Presentational data table: search bar, sortable headers, optional
 * pagination, and the shadcn table chrome. Table state lives entirely in
 * TanStack via `useAppTable`.
 */
export function DataTable<T extends RowData>({
  data,
  columns,
  getRowId,
  searchable = false,
  searchPlaceholder,
  toolbar,
  empty,
  pagination = false,
  pageSize = 10,
  initialSorting,
  initialGlobalFilter,
  initialColumnFilters,
  className,
}: DataTableProps<T>) {
  const table = useAppTable({
    data,
    columns,
    getRowId,
    initialState: {
      sorting: initialSorting,
      globalFilter: initialGlobalFilter,
      columnFilters: initialColumnFilters,
      pagination: { pageIndex: 0, pageSize },
    },
    getColumnCanGlobalFilter: (column) => column.id !== "actions",
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
                className="pl-8"
                value={(table.state.globalFilter as string) ?? ""}
                onChange={(e) => table.setGlobalFilter(e.target.value)}
              />
            </div>
          )}
          {typeof toolbar === "function" ? toolbar(table) : toolbar}
        </div>
      )}

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
                      colSpan={columns.length}
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

      {pagination && rows.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {table.state.pagination.pageIndex * pageSize + 1}–
            {Math.min(
              (table.state.pagination.pageIndex + 1) * pageSize,
              table.getRowCount()
            )}{" "}
            / {table.getRowCount()}
          </p>
          <div className="flex gap-2">
            <AnimateButton
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="size-4" />
            </AnimateButton>
            <AnimateButton
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight className="size-4" />
            </AnimateButton>
          </div>
        </div>
      )}
    </div>
  )
}

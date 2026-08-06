import { type ReactNode } from "react"
import {
  constructTable,
  createColumnHelper,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from "@tanstack/table-core"
import { storeReactivityBindings } from "@tanstack/table-core/store-reactivity-bindings"
import { flexRender } from "@tanstack/react-table"
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
  className?: string
}

/**
 * Server-component table built on TanStack Table v9 (`constructTable`).
 * Use for read-only tables rendered by RSC pages.
 */
export function ServerTable<T extends RowData>({
  data,
  columns,
  getRowId,
  empty,
  className,
}: ServerTableProps<T>) {
  const table = constructTable<ServerFeatures, T>({
    features: serverFeatures,
    columns,
    data,
    getRowId,
  })

  const rows = table.getRowModel().rows
  const headerGroups = table.getHeaderGroups()

  return (
    <div className={cn("overflow-x-auto", className)}>
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
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { DataTable, createAppColumnHelper } from "@/components/shared/data-table"

interface ShopEmployeeRow {
  id: string
  name: string
  position: string | null
  email: string
  isActive: boolean
}

const helper = createAppColumnHelper<ShopEmployeeRow>()

export function ShopEmployeesTable({ rows }: { rows: ShopEmployeeRow[] }) {
  const t = useTranslations("shopDetail")
  const tc = useTranslations("common")

  const columns = helper.columns([
    helper.accessor("name", {
      header: t("colName"),
      cell: ({ row }) => (
        <Link href={`/admin/employees/${row.original.id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    }),
    helper.accessor("position", {
      header: t("colPosition"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    helper.accessor("email", {
      header: t("colEmail"),
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1 text-muted-foreground">{getValue() as string}</div>
      ),
    }),
    helper.accessor("isActive", {
      header: t("colStatus"),
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? "default" : "secondary"}>
          {getValue() ? tc("active") : tc("inactive")}
        </Badge>
      ),
    }),
  ])

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      numbered
      pagination
      empty={t("noEmployees")}
    />
  )
}

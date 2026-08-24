"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import { DataTable, createAppColumnHelper } from "@/components/shared/data-table"

interface EmpInventoryRow {
  id: string
  productName: string
  sku: string
  quantity: number
  price: number
  statusKey: string
}

const helper = createAppColumnHelper<EmpInventoryRow>()

export function EmployeeInventoryTable({ rows }: { rows: EmpInventoryRow[] }) {
  const t = useTranslations("employeeInventory")

  const columns = helper.columns([
    helper.accessor("productName", {
      header: t("colProduct"),
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    }),
    helper.accessor("sku", {
      header: t("colSku"),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue() as string}</span>
      ),
    }),
    helper.accessor("quantity", {
      header: t("colShopStock"),
      cell: ({ getValue }) => getValue() as number,
    }),
    helper.accessor("price", {
      header: t("colPrice"),
      cell: ({ getValue }) => formatMoney(getValue() as number),
    }),
    helper.accessor("statusKey", {
      header: t("colStatus"),
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.statusKey)} className={row.original.statusKey === "statusOver" ? "text-blue-600" : undefined}>
          {t(row.original.statusKey)}
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
      empty={t("empty")}
    />
  )
}

function statusVariant(key: string): "default" | "secondary" | "destructive" | "outline" {
  switch (key) {
    case "statusOut":
      return "destructive"
    case "statusLow":
      return "secondary"
    case "statusOver":
      return "outline"
    default:
      return "default"
  }
}

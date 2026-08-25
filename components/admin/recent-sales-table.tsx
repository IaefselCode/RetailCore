"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import { DataTable, createAppColumnHelper } from "@/components/shared/data-table"

interface SaleRow {
  id: string
  invoiceNo: string
  customerName: string | null
  employeeName: string | null
  shopName: string
  itemCount: number
  total: number
  discount: number
  status: string
}

const helper = createAppColumnHelper<SaleRow>()

const statusBadge: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  VOIDED: "destructive",
  CANCELLED: "destructive",
}

export function RecentSalesTable({ rows, cardless }: { rows: SaleRow[]; cardless?: boolean }) {
  const t = useTranslations("dashboard")

  const columns = helper.columns([
    helper.accessor("invoiceNo", {
      header: t("colInvoice"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
    }),
    helper.accessor("customerName", {
      header: t("colCustomer"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    helper.accessor("employeeName", {
      header: t("colEmployee"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    helper.accessor("shopName", {
      header: t("colShop"),
      cell: ({ getValue }) => getValue() as string,
    }),
    helper.accessor("itemCount", {
      header: t("colItems"),
      cell: ({ getValue }) => getValue() as number,
    }),
    helper.accessor("total", {
      header: t("colAmount"),
      cell: ({ getValue }) => (
        <span className="font-medium">{formatMoney(getValue() as number)}</span>
      ),
    }),
    helper.accessor("discount", {
      header: t("colDiscount"),
      cell: ({ getValue }) => {
        const d = getValue() as number
        return d > 0 ? (
          <span className="text-green-600 text-xs font-medium">-{formatMoney(d)}</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )
      },
    }),
    helper.accessor("status", {
      header: t("colStatus"),
      cell: ({ getValue }) => (
        <Badge variant={statusBadge[getValue() as string] ?? "default"}>
          {getValue() as string}
        </Badge>
      ),
    }),
  ])

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      pagination
      cardless={cardless}
      empty={t("noSales")}
    />
  )
}

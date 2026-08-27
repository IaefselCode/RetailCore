"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import { useCurrency } from "@/components/providers/currency-provider"
import { useFormattedDate } from "@/components/providers/date-format-provider"
import { DataTable, createAppColumnHelper } from "@/components/shared/data-table"

interface ShopSaleRow {
  id: string
  invoiceNo: string
  customerName: string | null
  employeeName: string
  total: number
  paymentMethod: string | null
  createdAt: Date
  status: string
}

const saleHelper = createAppColumnHelper<ShopSaleRow>()

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  CANCELLED: "destructive",
  VOIDED: "destructive",
}

const STATUS_KEYS: Record<string, string> = {
  COMPLETED: "completed",
  PENDING: "pending",
  CANCELLED: "cancelled",
  VOIDED: "voided",
}

export function ShopSalesTable({ rows }: { rows: ShopSaleRow[] }) {
  const fmtDate = useFormattedDate()
  const t = useTranslations("shopDetail")
  const currency = useCurrency()

  const columns = saleHelper.columns([
    saleHelper.accessor("invoiceNo", {
      header: t("colInvoice"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
    }),
    saleHelper.accessor("customerName", {
      header: t("colCustomer"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    saleHelper.accessor("employeeName", {
      header: t("colEmployee"),
      cell: ({ getValue }) => (getValue() as string) || "—",
    }),
    saleHelper.accessor("total", {
      header: t("colAmount"),
      cell: ({ getValue }) => (
        <span className="font-medium">{formatMoney(getValue() as number, currency)}</span>
      ),
    }),
    saleHelper.accessor("paymentMethod", {
      header: t("colPayment"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    saleHelper.accessor("createdAt", {
      header: t("colDate"),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{fmtDate(getValue() as Date)}</span>
      ),
    }),
    saleHelper.accessor("status", {
      header: t("colStatus"),
      cell: ({ getValue }) => (
        <Badge variant={statusVariant[getValue() as string] ?? "default"}>
          {t(STATUS_KEYS[getValue() as string] ?? (getValue() as string))}
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
      empty={t("noSales")}
    />
  )
}

"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import { useCurrency } from "@/components/providers/currency-provider"
import { DataTable, createAppColumnHelper } from "@/components/shared/data-table"
import { useFormattedDate } from "@/components/providers/date-format-provider"

interface EmpSaleRow {
  id: string
  invoiceNo: string
  customerName: string | null
  items: number
  total: number
  discount: number
  paymentMethod: string | null
  createdAt: Date
  status: string
}

const helper = createAppColumnHelper<EmpSaleRow>()

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

export function EmployeeSalesTable({ rows, cardless }: { rows: EmpSaleRow[]; cardless?: boolean }) {
  const fmtDate = useFormattedDate()
  const t = useTranslations("employeeDetail")
  const currency = useCurrency()

  const columns = helper.columns([
    helper.accessor("invoiceNo", {
      header: t("colInvoice"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
    }),
    helper.accessor("customerName", {
      header: t("colCustomer"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    helper.accessor("items", {
      header: t("colItems"),
      cell: ({ getValue }) => getValue() as number,
    }),
    helper.accessor("total", {
      header: t("colAmount"),
      cell: ({ getValue }) => (
        <span className="font-medium">{formatMoney(getValue() as number, currency)}</span>
      ),
    }),
    helper.accessor("discount", {
      header: t("colDiscount"),
      cell: ({ getValue }) => {
        const d = getValue() as number
        return d > 0 ? (
          <span className="text-green-600 font-medium">-{formatMoney(d, currency)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    }),
    helper.accessor("paymentMethod", {
      header: t("colPayment"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    helper.accessor("createdAt", {
      header: t("colDate"),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{fmtDate(getValue() as Date)}</span>
      ),
    }),
    helper.accessor("status", {
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
      cardless={cardless}
      empty={t("noSales")}
    />
  )
}

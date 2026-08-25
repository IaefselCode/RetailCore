"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import { DataTable, createAppColumnHelper } from "@/components/shared/data-table"

interface EmpSaleRow {
  id: string
  invoiceNo: string
  customerName: string | null
  items: number
  total: number
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
  const t = useTranslations("employeeDetail")

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
        <span className="font-medium">{formatMoney(getValue() as number)}</span>
      ),
    }),
    helper.accessor("paymentMethod", {
      header: t("colPayment"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    helper.accessor("createdAt", {
      header: t("colDate"),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{(getValue() as Date).toLocaleDateString()}</span>
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

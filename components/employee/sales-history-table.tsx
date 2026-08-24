"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import { DataTable, createAppColumnHelper } from "@/components/shared/data-table"

interface EmpSalesRow {
  id: string
  invoiceNo: string
  customerName: string | null
  itemCount: number
  total: number
  createdAt: Date
  status: string
}

const helper = createAppColumnHelper<EmpSalesRow>()

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  VOIDED: "secondary",
  PENDING: "secondary",
  CANCELLED: "destructive",
}

const STATUS_KEYS: Record<string, string> = {
  COMPLETED: "completed",
  VOIDED: "voided",
  PENDING: "pending",
  CANCELLED: "cancelled",
}

export function EmployeeSalesHistoryTable({ rows }: { rows: EmpSalesRow[] }) {
  const t = useTranslations("employeeSalesHistory")

  const columns = helper.columns([
    helper.accessor("invoiceNo", {
      header: t("colInvoice"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
    }),
    helper.accessor("customerName", {
      header: t("colCustomer"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
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
      empty={t("empty")}
    />
  )
}

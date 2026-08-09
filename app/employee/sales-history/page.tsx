import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import { Table, TableHeader, TableBody, TableHead, TableRow } from "@/components/ui/table"
import { SalesHistoryFilter } from "@/components/employee/sales-history-filter"
import { TableRowsSkeleton } from "@/components/shared/skeleton-primitives"
import { ServerTable, createServerColumnHelper } from "@/components/shared/server-table"

export const metadata = { title: "Sales History | RetailCore" }

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

interface EmpSalesRow {
  id: string
  invoiceNo: string
  customerName: string | null
  itemCount: number
  total: number
  createdAt: Date
  status: string
}

const empSalesHelper = createServerColumnHelper<EmpSalesRow>()

async function SalesTableSection({
  shopId,
  employeeId,
  initialDate,
}: {
  shopId: string
  employeeId: string
  initialDate: string
}) {
  const t = await getTranslations("employeeSalesHistory")
  const where: Record<string, unknown> = { shopId, employeeId }
  if (initialDate) {
    where.createdAt = {
      gte: new Date(initialDate),
      lte: new Date(`${initialDate}T23:59:59`),
    }
  }

  return (
    <>
      <SalesHistoryFilter initialDate={initialDate} />

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colInvoice")}</TableHead>
                <TableHead>{t("colCustomer")}</TableHead>
                <TableHead>{t("colItems")}</TableHead>
                <TableHead>{t("colAmount")}</TableHead>
                <TableHead>{t("colDate")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Suspense
                fallback={
                  <TableRowsSkeleton
                    rows={8}
                    columns={["w-24", "w-20", "w-8", "w-16", "w-24", "w-20"]}
                  />
                }
              >
                <SalesBodyRows where={where} />
              </Suspense>
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}

async function SalesBodyRows({ where }: { where: Record<string, unknown> }) {
  const t = await getTranslations("employeeSalesHistory")
  const sales = await prisma.sale.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { select: { quantity: true } } },
  })

  const rows: EmpSalesRow[] = sales.map((sale) => ({
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    customerName: sale.customerName,
    itemCount: sale.items.reduce((sum, i) => sum + i.quantity, 0),
    total: Number(sale.total),
    createdAt: sale.createdAt,
    status: sale.status,
  }))

  const columns = empSalesHelper.columns([
    empSalesHelper.accessor("invoiceNo", {
      header: t("colInvoice"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
    }),
    empSalesHelper.accessor("customerName", {
      header: t("colCustomer"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    empSalesHelper.accessor("itemCount", { header: t("colItems"), cell: ({ getValue }) => getValue() as number }),
    empSalesHelper.accessor("total", {
      header: t("colAmount"),
      cell: ({ getValue }) => <span className="font-medium">{formatMoney(getValue() as number)}</span>,
    }),
    empSalesHelper.accessor("createdAt", {
      header: t("colDate"),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{(getValue() as Date).toLocaleDateString()}</span>
      ),
    }),
    empSalesHelper.accessor("status", {
      header: t("colStatus"),
      cell: ({ getValue }) => (
        <Badge variant={statusVariant[getValue() as string] ?? "default"}>
          {t(STATUS_KEYS[getValue() as string] ?? (getValue() as string))}
        </Badge>
      ),
    }),
  ])

  return (
    <ServerTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      empty={t("empty")}
      bodyOnly
    />
  )
}

export default async function EmployeeSalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const ctx = await requireEmployeeContext()
  const params = await searchParams
  const t = await getTranslations("employeeSalesHistory")

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{t("breadcrumb")}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      <SalesTableSection
        shopId={ctx.shopId}
        employeeId={ctx.employeeId}
        initialDate={params.date ?? ""}
      />
    </div>
  )
}

import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { SalesHistoryFilter } from "@/components/employee/sales-history-filter"
import { TableRowsSkeleton } from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Sales History | RetailCore" }

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  REFUNDED: "secondary",
  PENDING: "secondary",
  CANCELLED: "destructive",
}

const STATUS_KEYS: Record<string, string> = {
  COMPLETED: "completed",
  REFUNDED: "refunded",
  PENDING: "pending",
  CANCELLED: "cancelled",
}

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

  return (
    <>
      {sales.length === 0 && (
        <TableRow>
          <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </TableCell>
        </TableRow>
      )}
      {sales.map((sale) => {
        const itemCount = sale.items.reduce((sum, i) => sum + i.quantity, 0)
        return (
          <TableRow key={sale.id} className="transition-colors hover:bg-muted/50">
            <TableCell className="font-mono text-xs">{sale.invoiceNo}</TableCell>
            <TableCell>{sale.customerName ?? "—"}</TableCell>
            <TableCell>{itemCount}</TableCell>
            <TableCell className="font-medium">{formatMoney(sale.total)}</TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(sale.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[sale.status] ?? "default"}>
                {t(STATUS_KEYS[sale.status] ?? sale.status)}
              </Badge>
            </TableCell>
          </TableRow>
        )
      })}
    </>
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

import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { SalesHistoryFilter } from "@/components/employee/sales-history-filter"
import { EmployeeSalesHistoryTable } from "@/components/employee/sales-history-table"

export const metadata = { title: "Sales History | RetailCore" }

export default async function EmployeeSalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; page?: string }>
}) {
  const ctx = await requireEmployeeContext()
  const params = await searchParams
  const t = await getTranslations("employeeSalesHistory")
  const initialDate = params.date ?? ""

  const where: Record<string, unknown> = { shopId: ctx.shopId, employeeId: ctx.employeeId }
  if (initialDate) {
    where.createdAt = {
      gte: new Date(initialDate),
      lte: new Date(`${initialDate}T23:59:59`),
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { items: { select: { quantity: true } } },
  })

  const rows = sales.map((sale) => ({
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    customerName: sale.customerName,
    itemCount: sale.items.reduce((sum, i) => sum + i.quantity, 0),
    total: Number(sale.total),
    createdAt: sale.createdAt,
    status: sale.status,
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{t("breadcrumb")}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      <SalesHistoryFilter initialDate={initialDate} />

      <EmployeeSalesHistoryTable rows={rows} />
    </div>
  )
}
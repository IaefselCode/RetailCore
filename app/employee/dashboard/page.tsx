import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { EmployeeDashboard } from "@/components/employee/employee-dashboard"

export const metadata = { title: "Dashboard | RetailCore" }

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default async function EmployeeDashboardPage() {
  const ctx = await requireEmployeeContext()

  const now = new Date()
  const todayStart = startOfDay(now)
  const monthStart = startOfMonth(now)

  const [todayAgg, monthAgg, shopStockAgg, inventory, recentSales] = await Promise.all([
    prisma.sale.aggregate({
      where: { shopId: ctx.shopId, status: "COMPLETED", createdAt: { gte: todayStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: {
        shopId: ctx.shopId,
        employeeId: ctx.employeeId,
        status: "COMPLETED",
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
    }),
    prisma.inventory.aggregate({
      where: { shopId: ctx.shopId },
      _sum: { quantity: true },
    }),
    prisma.inventory.findMany({
      where: { shopId: ctx.shopId },
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { quantity: "asc" },
    }),
    prisma.sale.findMany({
      where: { shopId: ctx.shopId, employeeId: ctx.employeeId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const lowStock = inventory
    .filter((inv) => inv.quantity <= inv.minStock)
    .slice(0, 5)
    .map((inv) => ({
      name: inv.product.name,
      sku: inv.product.sku,
      quantity: inv.quantity,
      minStock: inv.minStock,
    }))

  return (
    <EmployeeDashboard
      firstName={ctx.firstName}
      shopName={ctx.shopName}
      todaySales={Number(todayAgg._sum.total ?? 0)}
      ordersToday={todayAgg._count}
      lowStockCount={lowStock.length}
      monthSales={Number(monthAgg._sum.total ?? 0)}
      stockUnits={Number(shopStockAgg._sum.quantity ?? 0)}
      recentSales={recentSales.map((s) => ({
        invoiceNo: s.invoiceNo,
        total: Number(s.total),
        createdAt: s.createdAt.toISOString(),
      }))}
      lowStock={lowStock}
    />
  )
}

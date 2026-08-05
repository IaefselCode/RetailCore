import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata = { title: "Dashboard | RetailCore" }

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default async function AdminDashboardPage() {
  await requireRole("ADMIN")

  const session = await auth()
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true },
      })
    : null

  const now = new Date()
  const todayStart = startOfDay(now)
  const monthStart = startOfMonth(now)

  const [todayAgg, monthAgg, productCount, recentSales, inventory] = await Promise.all([
    prisma.sale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: todayStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        shop: { select: { name: true } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.inventory.findMany({
      include: {
        product: { select: { name: true, sku: true } },
        shop: { select: { name: true } },
      },
      orderBy: { quantity: "asc" },
    }),
  ])

  const lowStock = inventory
    .filter((inv) => inv.quantity <= inv.minStock)
    .slice(0, 5)
    .map((inv) => ({
      name: inv.product.name,
      sku: inv.product.sku,
      shopName: inv.shop.name,
      quantity: inv.quantity,
      minStock: inv.minStock,
    }))

  return (
    <AdminDashboard
      firstName={user?.firstName ?? null}
      todaySales={Number(todayAgg._sum.total ?? 0)}
      ordersToday={todayAgg._count}
      monthRevenue={Number(monthAgg._sum.total ?? 0)}
      productCount={productCount}
      recentSales={recentSales.map((s) => ({
        invoiceNo: s.invoiceNo,
        customerName: s.customerName,
        shopName: s.shop.name,
        itemCount: s.items.reduce((sum, i) => sum + i.quantity, 0),
        total: Number(s.total),
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      }))}
      lowStock={lowStock}
    />
  )
}

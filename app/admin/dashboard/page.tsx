import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStat } from "@/components/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney } from "@/lib/money"

export const metadata = { title: "Dashboard | RetailCore" }

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

const statusBadge: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  REFUNDED: "destructive",
  CANCELLED: "destructive",
}

async function TodaySalesValue() {
  const agg = await prisma.sale.aggregate({
    where: { status: "COMPLETED", createdAt: { gte: startOfDay(new Date()) } },
    _sum: { total: true },
  })
  return <>{formatMoney(agg._sum.total ?? 0)}</>
}

async function OrdersTodayValue() {
  const count = await prisma.sale.count({
    where: { status: "COMPLETED", createdAt: { gte: startOfDay(new Date()) } },
  })
  return <>{count}</>
}

async function MonthRevenueValue() {
  const agg = await prisma.sale.aggregate({
    where: { status: "COMPLETED", createdAt: { gte: startOfMonth(new Date()) } },
    _sum: { total: true },
  })
  return <>{formatMoney(agg._sum.total ?? 0)}</>
}

async function ActiveProductsValue() {
  const count = await prisma.product.count({ where: { isActive: true } })
  return <>{count}</>
}
async function RecentSalesSection() {
  const recentSales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      shop: { select: { name: true } },
      items: { select: { quantity: true } },
    },
  })

  return (
    <CardContent className="px-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSales.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No sales yet
                </TableCell>
              </TableRow>
            )}
            {recentSales.map((sale) => (
              <TableRow key={sale.invoiceNo}>
                <TableCell className="font-mono text-xs">{sale.invoiceNo}</TableCell>
                <TableCell>{sale.customerName ?? "—"}</TableCell>
                <TableCell>{sale.shop.name}</TableCell>
                <TableCell>{sale.items.reduce((sum, i) => sum + i.quantity, 0)}</TableCell>
                <TableCell className="font-medium">{formatMoney(sale.total)}</TableCell>
                <TableCell>
                  <Badge variant={statusBadge[sale.status] ?? "default"}>{sale.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}

async function LowStockSection() {
  const inventory = await prisma.inventory.findMany({
    include: {
      product: { select: { name: true, sku: true } },
      shop: { select: { name: true } },
    },
    orderBy: { quantity: "asc" },
  })

  const lowStock = inventory.filter((inv) => inv.quantity <= inv.minStock).slice(0, 5)

  if (lowStock.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">All stock levels are healthy</p>
  }

  return (
    <>
      {lowStock.map((item) => (
        <div
          key={`${item.product.sku}-${item.shop.name}`}
          className="flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.product.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {item.shop.name} · {item.product.sku}
            </p>
          </div>
          <Badge
            variant={item.quantity <= 0 ? "destructive" : "secondary"}
            className="shrink-0"
          >
            {item.quantity} / {item.minStock}
          </Badge>
        </div>
      ))}
    </>
  )
}

function RecentSalesSkeleton() {
  return (
    <CardContent className="px-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, r) => (
              <TableRow key={r}>
                {Array.from({ length: 6 }).map((_, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}

function LowStockSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-14" />
        </div>
      ))}
    </div>
  )
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

  const values = {
    todaySales: (
      <Suspense fallback={<SkeletonStat />}>
        <TodaySalesValue />
      </Suspense>
    ),
    ordersToday: (
      <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
        <OrdersTodayValue />
      </Suspense>
    ),
    monthRevenue: (
      <Suspense fallback={<SkeletonStat />}>
        <MonthRevenueValue />
      </Suspense>
    ),
    productCount: (
      <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
        <ActiveProductsValue />
      </Suspense>
    ),
  }

  return (
    <AdminDashboard
      firstName={user?.firstName ?? null}
      values={values}
      recentSalesSection={
        <Suspense fallback={<RecentSalesSkeleton />}>
          <RecentSalesSection />
        </Suspense>
      }
      lowStockSection={
        <Suspense fallback={<LowStockSkeleton />}>
          <LowStockSection />
        </Suspense>
      }
    />
  )
}

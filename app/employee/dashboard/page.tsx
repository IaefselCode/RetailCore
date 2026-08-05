import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { EmployeeDashboard } from "@/components/employee/employee-dashboard"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStat } from "@/components/shared/skeletons"
import { ActivitiesCard } from "@/components/ui/activities-card"
import { ShoppingCart } from "lucide-react"
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

async function TodaySalesValue({ shopId }: { shopId: string }) {
  const agg = await prisma.sale.aggregate({
    where: { shopId, status: "COMPLETED", createdAt: { gte: startOfDay(new Date()) } },
    _sum: { total: true },
  })
  return <>{formatMoney(agg._sum.total ?? 0)}</>
}

async function OrdersTodayValue({ shopId }: { shopId: string }) {
  const count = await prisma.sale.count({
    where: { shopId, status: "COMPLETED", createdAt: { gte: startOfDay(new Date()) } },
  })
  return <>{count}</>
}

async function LowStockCountValue({ shopId }: { shopId: string }) {
  const inventory = await prisma.inventory.findMany({
    where: { shopId },
    select: { quantity: true, minStock: true },
  })
  const count = inventory.filter((inv) => inv.quantity <= inv.minStock).length
  return <>{count}</>
}

async function MonthSalesValue({ shopId, employeeId }: { shopId: string; employeeId: string }) {
  const agg = await prisma.sale.aggregate({
    where: {
      shopId,
      employeeId,
      status: "COMPLETED",
      createdAt: { gte: startOfMonth(new Date()) },
    },
    _sum: { total: true },
  })
  return <>{formatMoney(agg._sum.total ?? 0)}</>
}

async function StockUnitsValue({ shopId }: { shopId: string }) {
  const agg = await prisma.inventory.aggregate({ where: { shopId }, _sum: { quantity: true } })
  return <>{Number(agg._sum.quantity ?? 0)}</>
}
async function RecentSalesSection({ shopId, employeeId }: { shopId: string; employeeId: string }) {
  const recentSales = await prisma.sale.findMany({
    where: { shopId, employeeId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      invoiceNo: true,
      total: true,
      createdAt: true,
    },
  })

  const activities = recentSales.map((sale) => ({
    icon: <ShoppingCart className="size-5" />,
    title: sale.invoiceNo,
    desc: `Processed by you - ${formatMoney(sale.total)}`,
    time: timeAgo(sale.createdAt.toISOString()),
  }))

  return (
    <ActivitiesCard
      headerIcon={<ShoppingCart className="size-6 text-gray-500" />}
      title="Recent Activity"
      subtitle="Your latest transactions"
      activities={activities}
    />
  )
}

async function LowStockSection({ shopId }: { shopId: string }) {
  const inventory = await prisma.inventory.findMany({
    where: { shopId },
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { quantity: "asc" },
  })

  const lowStock = inventory.filter((inv) => inv.quantity <= inv.minStock).slice(0, 5)

  if (lowStock.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">All stock levels are healthy</p>
  }

  return (
    <>
      {lowStock.map((item) => (
        <div
          key={item.product.sku}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div>
            <p className="text-sm font-medium">{item.product.name}</p>
            <p className="text-xs text-muted-foreground">{item.product.sku}</p>
          </div>
          <div className="text-right">
            <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium">
              {item.quantity} in stock
            </span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Reorder at {item.minStock}
            </p>
          </div>
        </div>
      ))}
    </>
  )
}

function RecentSalesSkeleton() {
  return (
    <div className="space-y-3 rounded-lg p-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-44" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
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
export default async function EmployeeDashboardPage() {
  const ctx = await requireEmployeeContext()

  const values = {
    todaySales: (
      <Suspense fallback={<SkeletonStat />}>
        <TodaySalesValue shopId={ctx.shopId} />
      </Suspense>
    ),
    ordersToday: (
      <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
        <OrdersTodayValue shopId={ctx.shopId} />
      </Suspense>
    ),
    lowStockCount: (
      <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
        <LowStockCountValue shopId={ctx.shopId} />
      </Suspense>
    ),
    monthSales: (
      <Suspense fallback={<SkeletonStat />}>
        <MonthSalesValue shopId={ctx.shopId} employeeId={ctx.employeeId} />
      </Suspense>
    ),
    stockUnits: (
      <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
        <StockUnitsValue shopId={ctx.shopId} />
      </Suspense>
    ),
  }

  return (
    <EmployeeDashboard
      firstName={ctx.firstName}
      shopName={ctx.shopName}
      values={values}
      recentSalesSection={
        <Suspense fallback={<RecentSalesSkeleton />}>
          <RecentSalesSection shopId={ctx.shopId} employeeId={ctx.employeeId} />
        </Suspense>
      }
      lowStockSection={
        <Suspense fallback={<LowStockSkeleton />}>
          <LowStockSection shopId={ctx.shopId} />
        </Suspense>
      }
    />
  )
}

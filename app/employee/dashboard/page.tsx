import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { EmployeeDashboard } from "@/components/employee/employee-dashboard"
import { ShoppingCart } from "lucide-react"
import { formatMoney } from "@/lib/money"
import { SkeletonStat, ListSkeleton } from "@/components/shared/skeleton-primitives"

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

async function ActivityItems({ shopId, employeeId }: { shopId: string; employeeId: string }) {
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

  if (recentSales.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No transactions yet
      </div>
    )
  }

  return (
    <>
      {recentSales.map((sale) => (
        <div key={sale.invoiceNo} className="flex items-start gap-3 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingCart className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{sale.invoiceNo}</p>
            <p className="text-sm text-muted-foreground">
              Processed by you - {formatMoney(sale.total)}
            </p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {timeAgo(sale.createdAt.toISOString())}
          </span>
        </div>
      ))}
    </>
  )
}

async function LowStockItems({ shopId }: { shopId: string }) {
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

export default async function EmployeeDashboardPage() {
  const ctx = await requireEmployeeContext()

  return (
    <EmployeeDashboard
      firstName={ctx.firstName}
      shopName={ctx.shopName}
      kpiSlots={{
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
      }}
      activityItems={
        <Suspense fallback={<ListSkeleton rows={5} icon />}>
          <ActivityItems shopId={ctx.shopId} employeeId={ctx.employeeId} />
        </Suspense>
      }
      lowStockItems={
        <Suspense fallback={<ListSkeleton rows={4} />}>
          <LowStockItems shopId={ctx.shopId} />
        </Suspense>
      }
    />
  )
}

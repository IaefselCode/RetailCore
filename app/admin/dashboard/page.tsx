import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney, getSystemCurrency } from "@/lib/money"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStat, TableRowsSkeleton, ListSkeleton } from "@/components/shared/skeleton-primitives"
import { RecentSalesTable } from "@/components/admin/recent-sales-table"
import { isLowStock, isLowOrOut, isOutOfStock, isOverstocked } from "@/lib/stock-status"
import { buildStockHealth } from "@/lib/stock-health"

export const metadata = { title: "Dashboard | RetailCore" }

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

interface RecentSaleRow {
  id: string
  invoiceNo: string
  customerName: string | null
  employeeName: string | null
  shopName: string
  itemCount: number
  total: number
  discount: number
  status: string
}

async function TodaySalesValue() {
  const agg = await prisma.sale.aggregate({
    where: { status: "COMPLETED", createdAt: { gte: startOfDay(new Date()) } },
    _sum: { subtotal: true },
  })
  const currency = await getSystemCurrency()
  return <>{formatMoney(agg._sum.subtotal ?? 0, currency)}</>
}

async function TodayProfitValue() {
  const agg = await prisma.sale.aggregate({
    where: { status: "COMPLETED", createdAt: { gte: startOfDay(new Date()) } },
    _sum: { totalProfit: true },
  })
  const currency = await getSystemCurrency()
  return <>{formatMoney(agg._sum.totalProfit ?? 0, currency)}</>
}

async function UnitsTodayValue() {
  const rows = await prisma.saleItem.aggregate({
    where: { sale: { status: "COMPLETED", createdAt: { gte: startOfDay(new Date()) } } },
    _sum: { quantity: true },
  })
  return <>{rows._sum.quantity ?? 0}</>
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
    _sum: { subtotal: true },
  })
  const currency = await getSystemCurrency()
  return <>{formatMoney(agg._sum.subtotal ?? 0, currency)}</>
}

async function InventoryValueValue() {
  const rows = await prisma.inventory.findMany({
    select: { quantity: true, product: { select: { cost: true } } },
  })
  const value = rows.reduce((sum, r) => sum + r.quantity * (Number(r.product.cost) || 0), 0)
  const currency = await getSystemCurrency()
  return <>{formatMoney(value, currency)}</>
}

async function LowStockCountValue() {
  const rows = await prisma.inventory.findMany({ select: { quantity: true, minStock: true } })
  const count = rows.filter((r) => isLowStock(r.quantity, r.minStock)).length
  return <>{count}</>
}

async function ActiveProductsValue() {
  const count = await prisma.product.count({ where: { isActive: true } })
  return <>{count}</>
}

async function RecentSalesContent() {
  const recentSales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      shop: { select: { name: true } },
      employee: { include: { user: { select: { firstName: true, lastName: true } } } },
      items: { select: { quantity: true } },
    },
  })

  const rows: RecentSaleRow[] = recentSales.map((sale) => ({
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    customerName: sale.customerName,
    employeeName: sale.employee ? `${sale.employee.user.firstName ?? ""} ${sale.employee.user.lastName ?? ""}`.trim() || null : null,
    shopName: sale.shop.name,
    itemCount: sale.items.reduce((sum, i) => sum + i.quantity, 0),
    total: Number(sale.total),
    discount: Number(sale.discount),
    status: sale.status,
  }))

  return <RecentSalesTable rows={rows} cardless />
}

const MONTH_KEYS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

async function AnalyticsSection() {
  const t = await getTranslations("dashboard")
  const currency = await getSystemCurrency()
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11, 1)
  twelveMonthsAgo.setHours(0, 0, 0, 0)

  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: twelveMonthsAgo },
    },
    select: { subtotal: true, createdAt: true },
  })

  // Bucket completed sales by month for the last 12 months. Revenue is the
  // goods value (subtotal), consistent with the analytics module and the
  // profit/loss definition (spec §40).
  const buckets = new Map<string, number>()
  let revenue = 0
  for (const sale of sales) {
    revenue += Number(sale.subtotal)
    const key = `${sale.createdAt.getFullYear()}-${sale.createdAt.getMonth()}`
    buckets.set(key, (buckets.get(key) ?? 0) + Number(sale.subtotal))
  }

  // Best month over the trailing 12 months.
  let bestLabel = "—"
  let bestValue = 0
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = buckets.get(`${d.getFullYear()}-${d.getMonth()}`) ?? 0
    if (value > bestValue) {
      bestValue = value
      bestLabel = `${MONTH_KEYS[d.getMonth()]} ${d.getFullYear()}`
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <p className="text-xs text-muted-foreground">{t("analyticsRevenue")}</p>
        <p className="text-xl font-semibold">{formatMoney(revenue, currency)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{t("analyticsOrders")}</p>
        <p className="text-xl font-semibold">{sales.length.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{t("analyticsBestMonth")}</p>
        <p className="text-xl font-semibold">{bestLabel}</p>
        <p className="text-xs text-muted-foreground">{formatMoney(bestValue, currency)}</p>
      </div>
    </div>
  )
}

async function StockHealthOverview() {
  const t = await getTranslations("dashboard")
  const inventory = await prisma.inventory.findMany({
    include: {
      product: { select: { name: true, sku: true } },
      shop: { select: { id: true, name: true } },
    },
  })

  const { perShop, totals } = buildStockHealth(inventory)

  if (perShop.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t("stockHealthEmpty")}</p>
  }

  // Desktop: full table. Mobile: compact card layout.
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colShop")}</TableHead>
              <TableHead className="text-right">{t("colOut")}</TableHead>
              <TableHead className="text-right">{t("colLow")}</TableHead>
              <TableHead className="text-right">{t("colOver")}</TableHead>
              <TableHead className="text-right">{t("colHealthy")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perShop.map((r) => (
              <TableRow key={r.shopId}>
                <TableCell className="font-medium">{r.shopName}</TableCell>
                <TableCell className="text-right tabular-nums text-red-600">{r.out}</TableCell>
                <TableCell className="text-right tabular-nums text-yellow-600">{r.low}</TableCell>
                <TableCell className="text-right tabular-nums text-blue-600">{r.over}</TableCell>
                <TableCell className="text-right tabular-nums text-green-600">{r.healthy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">{t("colTotal")}</TableCell>
              <TableCell className="text-right tabular-nums text-red-600">{totals.out}</TableCell>
              <TableCell className="text-right tabular-nums text-yellow-600">{totals.low}</TableCell>
              <TableCell className="text-right tabular-nums text-blue-600">{totals.over}</TableCell>
              <TableCell className="text-right tabular-nums text-green-600">{totals.healthy}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      {/* Mobile: stacked cards */}
      <div className="divide-y md:hidden">
        {perShop.map((r) => (
          <div key={r.shopId} className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-medium truncate">{r.shopName}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-600">Out {r.out}</span>
              <span className="text-yellow-600">Low {r.low}</span>
              <span className="text-blue-600">Over {r.over}</span>
              <span className="text-green-600">OK {r.healthy}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
          <p className="text-sm font-bold">{t("colTotal")}</p>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-red-600">Out {totals.out}</span>
            <span className="text-yellow-600">Low {totals.low}</span>
            <span className="text-blue-600">Over {totals.over}</span>
            <span className="text-green-600">OK {totals.healthy}</span>
          </div>
        </div>
      </div>
    </>
  )
}

async function OverstockedItems() {
  const t = await getTranslations("dashboard")
  const inventory = await prisma.inventory.findMany({
    include: {
      product: { select: { name: true, sku: true } },
      shop: { select: { name: true } },
    },
    orderBy: { quantity: "desc" },
  })

  const overstocked = inventory.filter((inv) => isOverstocked(inv.quantity, inv.maxStock))
  const count = overstocked.length
  const top = overstocked.slice(0, 5)

  if (top.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t("noOverstocked")}</p>
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">{t("overstockedCount", { count })}</p>
      {top.map((item) => (
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
          <Badge variant="outline" className="shrink-0 text-blue-600">
            {item.quantity} / {item.maxStock}
          </Badge>
        </div>
      ))}
    </>
  )
}

async function LowStockItems() {
  const t = await getTranslations("dashboard")
  const inventory = await prisma.inventory.findMany({
    include: {
      product: { select: { name: true, sku: true } },
      shop: { select: { name: true } },
    },
    orderBy: { quantity: "asc" },
  })

  const lowStock = inventory.filter((inv) => isLowOrOut(inv.quantity, inv.minStock)).slice(0, 5)

  if (lowStock.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t("healthyStock")}</p>
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
            variant={isOutOfStock(item.quantity) ? "destructive" : "secondary"}
            className="shrink-0"
          >
            {item.quantity} / {item.minStock}
          </Badge>
        </div>
      ))}
    </>
  )
}

export default async function AdminDashboardPage() {
  await requireRole("ADMIN")
  const t = await getTranslations("dashboard")

  const session = await auth()
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true },
      })
    : null

  return (
    <AdminDashboard
      firstName={user?.firstName ?? null}
      kpiSlots={{
        todaySales: (
          <Suspense fallback={<SkeletonStat />}>
            <TodaySalesValue />
          </Suspense>
        ),
        todayProfit: (
          <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
            <TodayProfitValue />
          </Suspense>
        ),
        unitsToday: (
          <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
            <UnitsTodayValue />
          </Suspense>
        ),
        inventoryValue: (
          <Suspense fallback={<SkeletonStat />}>
            <InventoryValueValue />
          </Suspense>
        ),
        lowStockCount: (
          <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
            <LowStockCountValue />
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
      }}
      recentSalesContent={
        <Suspense
          fallback={
            <>
              {/* Desktop: full table chrome so the fallback stays valid HTML */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("colInvoice")}</TableHead>
                      <TableHead>{t("colCustomer")}</TableHead>
                      <TableHead>{t("colShop")}</TableHead>
                      <TableHead>{t("colItems")}</TableHead>
                      <TableHead>{t("colAmount")}</TableHead>
                      <TableHead>{t("colStatus")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRowsSkeleton
                      rows={5}
                      columns={["w-24", "w-20", "w-24", "w-8", "w-16", "w-20"]}
                    />
                  </TableBody>
                </Table>
              </div>
              {/* Mobile: stacked list skeleton */}
              <div className="divide-y md:hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-16 shrink-0" />
                  </div>
                ))}
              </div>
            </>
          }
        >
          <RecentSalesContent />
        </Suspense>
      }
      lowStockItems={
        <Suspense fallback={<ListSkeleton rows={5} />}>
          <LowStockItems />
        </Suspense>
      }
      stockHealthContent={
        <Suspense fallback={<ListSkeleton rows={5} />}>
          <StockHealthOverview />
        </Suspense>
      }
      overstockedItems={
        <Suspense fallback={<ListSkeleton rows={5} />}>
          <OverstockedItems />
        </Suspense>
      }
      analyticsSection={
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-28" />
                </div>
              ))}
            </div>
          }
        >
          <AnalyticsSection />
        </Suspense>
      }
    />
  )
}

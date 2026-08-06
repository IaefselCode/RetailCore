import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney } from "@/lib/money"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStat, TableRowsSkeleton, ListSkeleton } from "@/components/shared/skeleton-primitives"

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

async function RecentSalesContent() {
  const t = await getTranslations("dashboard")
  const recentSales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      shop: { select: { name: true } },
      items: { select: { quantity: true } },
    },
  })

  return (
    <>
      {/* Desktop: full table */}
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
            {recentSales.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  {t("noSales")}
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

      {/* Mobile: stacked cards */}
      <div className="divide-y md:hidden">
        {recentSales.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("noSales")}</p>
        )}
        {recentSales.map((sale) => (
          <div key={sale.invoiceNo} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs">{sale.invoiceNo}</p>
              <p className="truncate text-sm text-muted-foreground">
                {sale.customerName ?? "—"} · {sale.shop.name}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold">{formatMoney(sale.total)}</p>
              <Badge variant={statusBadge[sale.status] ?? "default"}>{sale.status}</Badge>
            </div>
          </div>
        ))}
      </div>
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

  const lowStock = inventory.filter((inv) => inv.quantity <= inv.minStock).slice(0, 5)

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
    />
  )
}

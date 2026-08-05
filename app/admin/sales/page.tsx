import { Suspense } from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { DollarSign, TrendingUp, CalendarDays, ShoppingCart } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStat } from "@/components/shared/skeletons"
import { formatMoney } from "@/lib/money"

export const metadata = { title: "Sales | RetailCore" }

const statusBadge: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  REFUNDED: "destructive",
  CANCELLED: "destructive",
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeek(d: Date) {
  const x = startOfDay(d)
  x.setDate(x.getDate() - x.getDay())
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

async function TodaySalesValue() {
  const agg = await prisma.sale.aggregate({
    where: { status: "COMPLETED", createdAt: { gte: startOfDay(new Date()) } },
    _sum: { total: true },
  })
  return <>{formatMoney(agg._sum.total ?? 0)}</>
}

async function WeekSalesValue() {
  const agg = await prisma.sale.aggregate({
    where: { status: "COMPLETED", createdAt: { gte: startOfWeek(new Date()) } },
    _sum: { total: true },
  })
  return <>{formatMoney(agg._sum.total ?? 0)}</>
}

async function MonthSalesValue() {
  const agg = await prisma.sale.aggregate({
    where: { status: "COMPLETED", createdAt: { gte: startOfMonth(new Date()) } },
    _sum: { total: true },
  })
  return <>{formatMoney(agg._sum.total ?? 0)}</>
}

async function TransactionsTodayValue() {
  const count = await prisma.sale.count({
    where: { status: "COMPLETED", createdAt: { gte: startOfDay(new Date()) } },
  })
  return <>{count}</>
}

async function RecentTransactionsSection() {
  const recentSales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      shop: { select: { name: true } },
      items: { select: { quantity: true } },
    },
  })

  return (
    <Card>
      <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSales.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No sales yet
                </TableCell>
              </TableRow>
            )}
            {recentSales.map((sale) => {
              const itemCount = sale.items.reduce((sum, i) => sum + i.quantity, 0)
              return (
                <TableRow key={sale.id} className="transition-colors hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{sale.invoiceNo}</TableCell>
                  <TableCell>{sale.customerName ?? "—"}</TableCell>
                  <TableCell>{sale.shop.name}</TableCell>
                  <TableCell>{itemCount}</TableCell>
                  <TableCell className="font-medium">{formatMoney(sale.total)}</TableCell>
                  <TableCell>{sale.paymentMethod ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[sale.status] ?? "default"}>{sale.status}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

function RecentTransactionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, r) => (
          <div key={r} className="grid grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, c) => (
              <Skeleton key={c} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}
export default async function SalesPage() {
  await requireRole("ADMIN")

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Dashboard <span className="mx-1">/</span> <span className="text-foreground">Sales</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Sales Management</h1>
        <div className="flex gap-2">
          <Link href="/admin/sales/history">
            <AnimateButton variant="outline">View History</AnimateButton>
          </Link>
          <Link href="/employee/record-sale">
            <AnimateButton variant="accent">
              <ShoppingCart className="size-4" />
              Record New Sale
            </AnimateButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Sales</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <DollarSign className="size-5 text-green-500" />
            <Suspense fallback={<SkeletonStat />}>
              <TodaySalesValue />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="size-5 text-blue-500" />
            <Suspense fallback={<SkeletonStat />}>
              <WeekSalesValue />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <CalendarDays className="size-5 text-purple-500" />
            <Suspense fallback={<SkeletonStat />}>
              <MonthSalesValue />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Transactions Today</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
              <TransactionsTodayValue />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<RecentTransactionsSkeleton />}>
        <RecentTransactionsSection />
      </Suspense>
    </div>
  )
}


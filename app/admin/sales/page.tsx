import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { DollarSign, TrendingUp, CalendarDays, ShoppingCart } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

export default async function SalesPage() {
  await requireRole("ADMIN")

  const now = new Date()
  const todayStart = startOfDay(now)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  const [todayAgg, weekAgg, monthAgg, recentSales] = await Promise.all([
    prisma.sale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: todayStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: weekStart } },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        shop: { select: { name: true } },
        items: { select: { quantity: true } },
      },
    }),
  ])

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
            {formatMoney(todayAgg._sum.total)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="size-5 text-blue-500" />
            {formatMoney(weekAgg._sum.total)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <CalendarDays className="size-5 text-purple-500" />
            {formatMoney(monthAgg._sum.total)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Transactions Today</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{todayAgg._count}</CardContent>
        </Card>
      </div>

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
    </div>
  )
}

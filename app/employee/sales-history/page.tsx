import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { SalesHistoryFilter } from "@/components/employee/sales-history-filter"

export const metadata = { title: "Sales History | RetailCore" }

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  REFUNDED: "secondary",
  PENDING: "secondary",
  CANCELLED: "destructive",
}

export default async function EmployeeSalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const ctx = await requireEmployeeContext()
  const params = await searchParams

  const where: Record<string, unknown> = { shopId: ctx.shopId, employeeId: ctx.employeeId }
  if (params.date) {
    where.createdAt = {
      gte: new Date(params.date),
      lte: new Date(`${params.date}T23:59:59`),
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { select: { quantity: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard &gt; Sales</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sales History</h1>
      </div>

      <SalesHistoryFilter initialDate={params.date ?? ""} />

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No sales found
                  </TableCell>
                </TableRow>
              )}
              {sales.map((sale) => {
                const itemCount = sale.items.reduce((sum, i) => sum + i.quantity, 0)
                return (
                  <TableRow key={sale.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{sale.invoiceNo}</TableCell>
                    <TableCell>{sale.customerName ?? "—"}</TableCell>
                    <TableCell>{itemCount}</TableCell>
                    <TableCell className="font-medium">{formatMoney(sale.total)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[sale.status] ?? "default"}>{sale.status}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

import { Suspense } from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { ShoppingCart } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney } from "@/lib/money"
import { Skeleton } from "@/components/ui/skeleton"
import { TableRowsSkeleton } from "@/components/shared/skeleton-primitives"
import { ServerTable, createServerColumnHelper } from "@/components/shared/server-table"
import { SalesOverview, type SalesPeriodData } from "@/components/admin/sales-overview"

export const metadata = { title: "Sales | RetailCore" }

const statusBadge: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  VOIDED: "destructive",
  CANCELLED: "destructive",
}

interface RecentSaleRow {
  id: string
  invoiceNo: string
  customerName: string | null
  shopName: string
  itemCount: number
  total: number
  paymentMethod: string | null
  createdAt: Date
  status: string
}

const saleHelper = createServerColumnHelper<RecentSaleRow>()

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

async function SalesOverviewData(): Promise<SalesPeriodData[]> {
  const now = new Date()
  const periods = [
    { key: "today" as const, from: startOfDay(now) },
    { key: "week" as const, from: startOfWeek(now) },
    { key: "month" as const, from: startOfMonth(now) },
    { key: "year" as const, from: new Date(now.getFullYear(), 0, 1) },
  ]

  const out: SalesPeriodData[] = []
  for (const period of periods) {
    const [saleAgg, itemAgg] = await Promise.all([
      prisma.sale.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: period.from } },
        _sum: { subtotal: true, totalCost: true, totalProfit: true },
        _count: true,
      }),
      prisma.saleItem.aggregate({
        where: { sale: { status: "COMPLETED", createdAt: { gte: period.from } } },
        _sum: { quantity: true },
      }),
    ])
    out.push({
      key: period.key,
      revenue: Number(saleAgg._sum.subtotal ?? 0),
      cost: Number(saleAgg._sum.totalCost ?? 0),
      profit: Number(saleAgg._sum.totalProfit ?? 0),
      units: itemAgg._sum.quantity ?? 0,
      transactions: saleAgg._count,
    })
  }
  return out
}

async function RecentTransactionsSection() {
  const t = await getTranslations("sales")
  return (
    <Card>
      <CardHeader><CardTitle>{t("recentTransactions")}</CardTitle></CardHeader>
      <CardContent className="p-0">
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
                      <TableHead>{t("colPayment")}</TableHead>
                      <TableHead>{t("colDate")}</TableHead>
                      <TableHead>{t("colStatus")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRowsSkeleton
                      rows={8}
                      columns={["w-24", "w-20", "w-24", "w-8", "w-16", "w-16", "w-24", "w-20"]}
                    />
                  </TableBody>
                </Table>
              </div>
              {/* Mobile: stacked list skeleton */}
              <div className="divide-y md:hidden">
                {Array.from({ length: 6 }).map((_, i) => (
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
          <RecentTransactionsTable t={t} />
        </Suspense>
      </CardContent>
    </Card>
  )
}

async function RecentTransactionsTable({ t }: { t: (key: string) => string }) {
  const recentSales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      shop: { select: { name: true } },
      items: { select: { quantity: true } },
    },
  })

  const rows: RecentSaleRow[] = recentSales.map((sale) => ({
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    customerName: sale.customerName,
    shopName: sale.shop.name,
    itemCount: sale.items.reduce((sum, i) => sum + i.quantity, 0),
    total: Number(sale.total),
    paymentMethod: sale.paymentMethod,
    createdAt: sale.createdAt,
    status: sale.status,
  }))

  const columns = saleHelper.columns([
    saleHelper.accessor("invoiceNo", {
      header: t("colInvoice"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
    }),
    saleHelper.accessor("customerName", {
      header: t("colCustomer"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    saleHelper.accessor("shopName", { header: t("colShop"), cell: ({ getValue }) => getValue() as string }),
    saleHelper.accessor("itemCount", { header: t("colItems"), cell: ({ getValue }) => getValue() as number }),
    saleHelper.accessor("total", {
      header: t("colAmount"),
      cell: ({ getValue }) => <span className="font-medium">{formatMoney(getValue() as number)}</span>,
    }),
    saleHelper.accessor("paymentMethod", {
      header: t("colPayment"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    saleHelper.accessor("createdAt", {
      header: t("colDate"),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{(getValue() as Date).toLocaleDateString()}</span>
      ),
    }),
    saleHelper.accessor("status", {
      header: t("colStatus"),
      cell: ({ getValue }) => (
        <Badge variant={statusBadge[getValue() as string] ?? "default"}>
          {getValue() as string}
        </Badge>
      ),
    }),
  ])

  return (
    <>
      {/* Desktop: table (TanStack) */}
      <div className="hidden md:block">
        <ServerTable
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          empty={t("empty")}
        />
      </div>

      {/* Mobile: stacked cards */}
      <div className="divide-y md:hidden">
        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        )}
        {rows.map((sale) => (
          <div key={sale.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs">{sale.invoiceNo}</p>
              <p className="truncate text-sm text-muted-foreground">
                {sale.customerName ?? "—"} · {sale.shopName} · {sale.itemCount} {t("colItems").toLowerCase()}
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

export default async function SalesPage() {
  await requireRole("ADMIN")
  const t = await getTranslations("sales")
  const tc = await getTranslations("common")

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        {tc("home")} <span className="mx-1">/</span> <span className="text-foreground">{t("breadcrumb")}</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/sales/history">
            <AnimateButton variant="outline">{t("viewHistory")}</AnimateButton>
          </Link>
          <Link href="/employee/record-sale">
            <AnimateButton variant="accent">
              <ShoppingCart className="size-4" />
              {t("recordNewSale")}
            </AnimateButton>
          </Link>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <SalesOverview data={await SalesOverviewData()} />
      </Suspense>

      <RecentTransactionsSection />
    </div>
  )
}

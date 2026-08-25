import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { SalesHistoryTable } from "@/components/admin/sales-history-table"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonTable } from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Sales History | RetailCore" }

const PAGE_SIZE = 10

interface SearchParams {
  dateFrom?: string
  dateTo?: string
  paymentMethod?: string
  status?: string
  shopId?: string
  page?: string
}

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole("ADMIN")
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)

  return (
    <Suspense fallback={<SalesHistorySkeleton />}>
      <SalesHistoryContent searchParams={params} page={page} />
    </Suspense>
  )
}

function SalesHistorySkeleton() {
  // Mirrors SalesHistoryTable's exact arrangement: heading + export,
  // filter bar, table (9 cols), pagination.
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md sm:w-40" />
          ))}
        </CardContent>
      </Card>

      <SkeletonTable
        rows={10}
        columns={["w-24", "w-20", "w-24", "w-8", "w-16", "w-16", "w-24", "w-20", "w-16"]}
        headers={["Invoice", "Customer", "Shop", "Items", "Amount", "Payment", "Date", "Status", "Actions"]}
      />

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  )
}

async function SalesHistoryContent({
  searchParams,
  page,
}: {
  searchParams: SearchParams
  page: number
}) {
  const where: Record<string, unknown> = {}
  if (searchParams.dateFrom || searchParams.dateTo) {
    where.createdAt = {
      ...(searchParams.dateFrom ? { gte: new Date(searchParams.dateFrom) } : {}),
      ...(searchParams.dateTo ? { lte: new Date(`${searchParams.dateTo}T23:59:59`) } : {}),
    }
  }
  if (searchParams.paymentMethod && searchParams.paymentMethod !== "all") {
    where.paymentMethod = searchParams.paymentMethod
  }
  if (searchParams.status && searchParams.status !== "all") {
    where.status = searchParams.status.toUpperCase()
  }
  if (searchParams.shopId && searchParams.shopId !== "all") {
    where.shopId = searchParams.shopId
  }

  const [sales, total, shops] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        shop: { select: { name: true } },
        employee: { include: { user: { select: { firstName: true, lastName: true } } } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.sale.count({ where }),
    prisma.shop.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return (
    <SalesHistoryTable
      sales={sales.map((s) => ({
        id: s.id,
        invoiceNo: s.invoiceNo,
        customerName: s.customerName,
        employeeName: s.employee ? `${s.employee.user.firstName ?? ""} ${s.employee.user.lastName ?? ""}`.trim() || null : null,
        shopName: s.shop.name,
        itemCount: s.items.reduce((sum, i) => sum + i.quantity, 0),
        total: Number(s.total),
        discount: Number(s.discount),
        paymentMethod: s.paymentMethod,
        createdAt: s.createdAt.toISOString(),
        status: s.status,
      }))}
      shops={shops}
      total={total}
      initialFilters={{
        dateFrom: searchParams.dateFrom ?? "",
        dateTo: searchParams.dateTo ?? "",
        paymentMethod: searchParams.paymentMethod ?? "all",
        status: searchParams.status ?? "all",
        shopId: searchParams.shopId ?? "all",
        page,
      }}
    />
  )
}

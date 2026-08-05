import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { SkeletonTable } from "@/components/shared/skeletons"
import { SalesHistoryTable } from "@/components/admin/sales-history-table"

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

  const where: Record<string, unknown> = {}
  if (params.dateFrom || params.dateTo) {
    where.createdAt = {
      ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
      ...(params.dateTo ? { lte: new Date(`${params.dateTo}T23:59:59`) } : {}),
    }
  }
  if (params.paymentMethod && params.paymentMethod !== "all") {
    where.paymentMethod = params.paymentMethod
  }
  if (params.status && params.status !== "all") {
    where.status = params.status.toUpperCase()
  }
  if (params.shopId && params.shopId !== "all") {
    where.shopId = params.shopId
  }

  const [sales, total, shops] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        shop: { select: { name: true } },
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
    <Suspense fallback={<SkeletonTable rows={8} cols={8} />}>
      <SalesHistoryTable
        sales={sales.map((s) => ({
          id: s.id,
          invoiceNo: s.invoiceNo,
          customerName: s.customerName,
          shopName: s.shop.name,
          itemCount: s.items.reduce((sum, i) => sum + i.quantity, 0),
          total: Number(s.total),
          paymentMethod: s.paymentMethod,
          createdAt: s.createdAt.toISOString(),
          status: s.status,
        }))}
        shops={shops}
        total={total}
        initialFilters={{
          dateFrom: params.dateFrom ?? "",
          dateTo: params.dateTo ?? "",
          paymentMethod: params.paymentMethod ?? "all",
          status: params.status ?? "all",
          shopId: params.shopId ?? "all",
          page,
        }}
      />
    </Suspense>
  )
}

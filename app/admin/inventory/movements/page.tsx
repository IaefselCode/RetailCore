import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { MovementsTable, type MovementRow } from "@/components/admin/movements-table"

export const metadata = { title: "Inventory Movements | RetailCore" }

interface SearchParams {
  product?: string
  shopId?: string
  type?: string
  dateFrom?: string
  dateTo?: string
  page?: string
}

const PAGE_SIZE = 20

export default async function InventoryMovementsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole("ADMIN")
  const t = await getTranslations("inventory")
  const tc = await getTranslations("common")
  const params = await searchParams

  const where: Record<string, unknown> = {}
  if (params.shopId && params.shopId !== "all") where.shopId = params.shopId
  if (params.type && params.type !== "all") where.type = params.type
  if (params.product && params.product.trim()) {
    where.product = { name: { contains: params.product.trim(), mode: "insensitive" } }
  }
  if (params.dateFrom || params.dateTo) {
    where.createdAt = {
      ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
      ...(params.dateTo ? { lte: new Date(`${params.dateTo}T23:59:59`) } : {}),
    }
  }

  const page = Math.max(1, Number(params.page) || 1)

  const [movements, total, shops] = await Promise.all([
    prisma.stockTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        product: { select: { name: true, sku: true } },
        shop: { select: { name: true } },
      },
    }),
    prisma.stockTransaction.count({ where }),
    prisma.shop.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])

  const rows: MovementRow[] = movements.map((m) => ({
    id: m.id,
    productName: m.product.name,
    sku: m.product.sku,
    shopName: m.shop.name,
    type: m.type,
    quantity: m.quantity,
    reference: m.reference,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
  }))

  // Summary for the filtered set: total units in / out.
  const agg = await prisma.stockTransaction.aggregate({
    where,
    _sum: { quantity: true },
  })
  const sumQuantity = Number(agg._sum.quantity ?? 0)
  // Units out are negative; derive in/out by summing separately.
  const [inAgg, outAgg] = await Promise.all([
    prisma.stockTransaction.aggregate({ where: { ...where, quantity: { gt: 0 } }, _sum: { quantity: true } }),
    prisma.stockTransaction.aggregate({ where: { ...where, quantity: { lt: 0 } }, _sum: { quantity: true } }),
  ])

  return (
    <div className="space-y-6">
      <MovementsTable
        rows={rows}
        shops={shops.map((s) => ({ id: s.id, name: s.name }))}
        total={total}
        unitsIn={Number(inAgg._sum.quantity ?? 0)}
        unitsOut={Number(outAgg._sum.quantity ?? 0)}
        netQuantity={sumQuantity}
        initialFilters={{
          product: params.product ?? "",
          shopId: params.shopId ?? "all",
          type: params.type ?? "all",
          dateFrom: params.dateFrom ?? "",
          dateTo: params.dateTo ?? "",
          page,
        }}
        pageSize={PAGE_SIZE}
        labels={{ home: tc("home"), title: t("movementTitle"), breadcrumb: t("movementBreadcrumb") }}
      />
    </div>
  )
}

import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Package, AlertTriangle, XCircle, ShoppingCart, ArrowRightLeft, History, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStat, TableRowsSkeleton } from "@/components/shared/skeleton-primitives"
import { ServerTable, createServerColumnHelper } from "@/components/shared/server-table"
import { InventoryFilters } from "@/components/admin/inventory-filters"
import { stockStatusKey, stockStatusVariant, isLowStock, isOverstocked } from "@/lib/stock-status"

export const metadata = { title: "Inventory | RetailCore" }

interface SearchParams {
  q?: string
  shopId?: string
  status?: string
}

interface InventoryRow {
  id: string
  productName: string
  sku: string
  shopName: string
  quantity: number
  minStock: number
  maxStock: number
  statusKey: string
  statusVariant: "default" | "secondary" | "destructive" | "outline"
}

const inventoryHelper = createServerColumnHelper<InventoryRow>()

async function TotalUnitsValue({ where }: { where: Record<string, unknown> }) {
  const rows = await prisma.inventory.findMany({ where, select: { quantity: true } })
  const total = rows.reduce((sum, r) => sum + r.quantity, 0)
  return <>{total.toLocaleString()}</>
}

async function LowStockCountValue({ where }: { where: Record<string, unknown> }) {
  const rows = await prisma.inventory.findMany({ where, select: { quantity: true, minStock: true } })
  const count = rows.filter((r) => isLowStock(r.quantity, r.minStock)).length
  return <>{count}</>
}

async function OutOfStockCountValue({ where }: { where: Record<string, unknown> }) {
  const rows = await prisma.inventory.findMany({ where, select: { quantity: true } })
  const count = rows.filter((r) => r.quantity <= 0).length
  return <>{count}</>
}

async function OverstockedCountValue({ where }: { where: Record<string, unknown> }) {
  const rows = await prisma.inventory.findMany({ where, select: { quantity: true, maxStock: true } })
  const count = rows.filter((r) => isOverstocked(r.quantity, r.maxStock)).length
  return <>{count}</>
}

async function InventoryTableSection({
  where,
  status,
  hasFilters,
}: {
  where: Record<string, unknown>
  status?: string
  hasFilters: boolean
}) {
  const t = await getTranslations("inventory")
  return (
    <Card>
      <CardContent className="p-0">
        <Suspense
          fallback={
            <>
              {/* Desktop: full table chrome so the fallback stays valid HTML */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("colProduct")}</TableHead>
                      <TableHead>{t("colSku")}</TableHead>
                      <TableHead>{t("colShop")}</TableHead>
                      <TableHead>{t("colQuantity")}</TableHead>
                      <TableHead>{t("colMinStock")}</TableHead>
                      <TableHead>{t("colStatus")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRowsSkeleton
                      rows={8}
                      columns={["w-32", "w-20", "w-24", "w-10", "w-8", "w-20"]}
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
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16 shrink-0" />
                  </div>
                ))}
              </div>
            </>
          }
        >
          <InventoryTable t={t} where={where} status={status} hasFilters={hasFilters} />
        </Suspense>
      </CardContent>
    </Card>
  )
}

async function InventoryTable({
  t,
  where,
  status,
  hasFilters,
}: {
  t: (key: string) => string
  where: Record<string, unknown>
  status?: string
  hasFilters: boolean
}) {
  const inv = await prisma.inventory.findMany({
    where,
    orderBy: [{ shop: { name: "asc" } }, { product: { name: "asc" } }],
    include: {
      product: { select: { name: true, sku: true } },
      shop: { select: { name: true } },
    },
  })

  const allRows: InventoryRow[] = inv.map((row) => {
    const key = stockStatusKey(row.quantity, row.minStock, row.maxStock)
    return {
      id: row.id,
      productName: row.product.name,
      sku: row.product.sku,
      shopName: row.shop.name,
      quantity: row.quantity,
      minStock: row.minStock,
      maxStock: row.maxStock,
      statusKey: key,
      statusVariant: stockStatusVariant(key),
    }
  })

  // Status is computed (quantity vs minStock/maxStock), so it can't be
  // expressed in the Prisma where — apply it here over the query-filtered rows.
  const rows =
    status === "in"
      ? allRows.filter((r) => stockStatusKey(r.quantity, r.minStock, r.maxStock) === "statusIn")
      : status === "low"
        ? allRows.filter((r) => stockStatusKey(r.quantity, r.minStock, r.maxStock) === "statusLow")
        : status === "over"
          ? allRows.filter((r) => stockStatusKey(r.quantity, r.minStock, r.maxStock) === "statusOver")
          : status === "out"
            ? allRows.filter((r) => stockStatusKey(r.quantity, r.minStock, r.maxStock) === "statusOut")
            : allRows

  const columns = inventoryHelper.columns([
    inventoryHelper.accessor("productName", {
      header: t("colProduct"),
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    }),
    inventoryHelper.accessor("sku", {
      header: t("colSku"),
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() as string}</span>,
    }),
    inventoryHelper.accessor("shopName", { header: t("colShop"), cell: ({ getValue }) => getValue() as string }),
    inventoryHelper.accessor("quantity", {
      header: t("colQuantity"),
      cell: ({ getValue }) => <span className="font-semibold">{getValue() as number}</span>,
    }),
    inventoryHelper.accessor("minStock", { header: t("colMinStock"), cell: ({ getValue }) => getValue() as number }),
    inventoryHelper.accessor("statusKey", {
      header: t("colStatus"),
      cell: ({ row }) => (
        <Badge
          variant={row.original.statusVariant}
          className={row.original.statusKey === "statusOver" ? "text-blue-600" : undefined}
        >
          {t(row.original.statusKey)}
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
          numbered
          empty={rows.length === 0 && hasFilters ? t("noResults") : t("empty")}
        />
      </div>

      {/* Mobile: stacked cards */}
      <div className="divide-y md:hidden">
        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {hasFilters ? t("noResults") : t("empty")}
          </p>
        )}
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.productName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.shopName} · {row.sku}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold">{row.quantity}</p>
              <Badge
                variant={row.statusVariant}
                className={row.statusKey === "statusOver" ? "text-blue-600" : undefined}
              >
                {t(row.statusKey)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole("ADMIN")
  const t = await getTranslations("inventory")
  const tc = await getTranslations("common")
  const params = await searchParams

  const q = params.q?.trim() ?? ""
  const shopId = params.shopId ?? "all"
  const status = params.status ?? "all"

  // Text + shop filters run in the database; status is applied in JS.
  const where: Record<string, unknown> = {}
  if (q) {
    where.OR = [
      { product: { name: { contains: q, mode: "insensitive" } } },
      { product: { sku: { contains: q, mode: "insensitive" } } },
    ]
  }
  if (shopId && shopId !== "all") where.shopId = shopId

  const shops = await prisma.shop.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const hasFilters = q !== "" || shopId !== "all" || status !== "all"

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        {tc("home")} <span className="mx-1">/</span> <span className="text-foreground">{t("breadcrumb")}</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/inventory/stock-health">
            <AnimateButton variant="outline">
              <Activity className="size-4" />
              {t("stockHealth")}
            </AnimateButton>
          </Link>
          <Link href="/admin/inventory/movements">
            <AnimateButton variant="outline">
              <History className="size-4" />
              {t("movementHistory")}
            </AnimateButton>
          </Link>
          <Link href="/admin/inventory/purchase-stock">
            <AnimateButton variant="accent">
              <ShoppingCart className="size-4" />
              {t("purchaseStock")}
            </AnimateButton>
          </Link>
          <Link href="/admin/inventory/stock-distribution">
            <AnimateButton variant="outline">
              <ArrowRightLeft className="size-4" />
              {t("stockDistribution")}
            </AnimateButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{t("totalUnits")}</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Package className="size-5 text-muted-foreground" />
            <Suspense fallback={<SkeletonStat />}>
              <TotalUnitsValue where={where} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{t("lowStock")}</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold text-yellow-600">
            <AlertTriangle className="size-5" />
            <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
              <LowStockCountValue where={where} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{t("outOfStock")}</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold text-red-600">
            <XCircle className="size-5" />
            <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
              <OutOfStockCountValue where={where} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{t("overstocked")}</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-blue-600">
            <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
              <OverstockedCountValue where={where} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <InventoryFilters
        shops={shops}
        initial={{ q, shopId, status }}
      />

      <InventoryTableSection where={where} status={status} hasFilters={hasFilters} />
    </div>
  )
}

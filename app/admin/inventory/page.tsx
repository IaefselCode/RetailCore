import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Package, AlertTriangle, XCircle, ShoppingCart, ArrowRightLeft, History, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { SkeletonStat } from "@/components/shared/skeleton-primitives"
import { InventoryTable, type InventoryRow } from "@/components/admin/inventory-table"
import { stockStatusKey, isLowStock, isOverstocked } from "@/lib/stock-status"

export const metadata = { title: "Inventory | RetailCore" }

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
export default async function InventoryPage() {
  await requireRole("ADMIN")
  const t = await getTranslations("inventory")
  const tc = await getTranslations("common")

  // All inventory is fetched server-side; search/shop/status filtering and
  // pagination are handled client-side by the TanStack DataTable.
  const [inv, shops] = await Promise.all([
    prisma.inventory.findMany({
      orderBy: [{ shop: { name: "asc" } }, { product: { name: "asc" } }],
      include: {
        product: { select: { name: true, sku: true } },
        shop: { select: { id: true, name: true } },
      },
    }),
    prisma.shop.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const rows: InventoryRow[] = inv.map((row) => ({
    id: row.id,
    productName: row.product.name,
    sku: row.product.sku,
    shopName: row.shop.name,
    quantity: row.quantity,
    minStock: row.minStock,
    maxStock: row.maxStock,
    statusKey: stockStatusKey(row.quantity, row.minStock, row.maxStock),
  }))

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
              <TotalUnitsValue where={{}} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{t("lowStock")}</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold text-yellow-600">
            <AlertTriangle className="size-5" />
            <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
              <LowStockCountValue where={{}} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{t("outOfStock")}</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold text-red-600">
            <XCircle className="size-5" />
            <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
              <OutOfStockCountValue where={{}} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{t("overstocked")}</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-blue-600">
            <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
              <OverstockedCountValue where={{}} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <InventoryTable rows={rows} shops={shops} />
    </div>
  )
}

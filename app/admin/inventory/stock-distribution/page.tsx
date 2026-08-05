import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { StockDistributionForm } from "@/components/admin/stock-distribution-form"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonTable } from "@/components/shared/skeletons"

export const metadata = { title: "Stock Distribution | RetailCore" }

export default async function StockDistributionPage() {
  await requireRole("ADMIN")

  return (
    <Suspense fallback={<StockDistributionSkeleton />}>
      <StockDistributionContent />
    </Suspense>
  )
}

async function StockDistributionContent() {
  const [shops, products, inventory] = await Promise.all([
    prisma.shop.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true },
    }),
    prisma.inventory.findMany({ select: { productId: true, shopId: true, quantity: true } }),
  ])

  const stockMap = new Map<string, Record<string, number>>()
  for (const inv of inventory) {
    if (!stockMap.has(inv.productId)) stockMap.set(inv.productId, {})
    stockMap.get(inv.productId)![inv.shopId] = inv.quantity
  }

  return (
    <StockDistributionForm
      shops={shops}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stockByShop: stockMap.get(p.id) ?? {},
      }))}
    />
  )
}

function StockDistributionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg p-6">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-lg p-6">
        <Skeleton className="h-5 w-32" />
        <SkeletonTable rows={3} cols={4} />
        <div className="flex justify-end">
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
    </div>
  )
}


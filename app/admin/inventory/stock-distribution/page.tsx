import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { StockDistributionForm } from "@/components/admin/stock-distribution-form"
import { FormSkeleton } from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Stock Distribution | RetailCore" }

export default async function StockDistributionPage() {
  await requireRole("ADMIN")

  return (
    <Suspense fallback={<FormSkeleton fields={4} />}>
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

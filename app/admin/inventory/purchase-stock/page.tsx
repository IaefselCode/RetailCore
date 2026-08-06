import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { PurchaseStockForm } from "@/components/admin/purchase-stock-form"
import { FormSkeleton } from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Purchase Stock | RetailCore" }

export default async function PurchaseStockPage() {
  await requireRole("ADMIN")

  return (
    <Suspense fallback={<FormSkeleton fields={4} />}>
      <PurchaseStockContent />
    </Suspense>
  )
}

async function PurchaseStockContent() {
  const [shops, products] = await Promise.all([
    prisma.shop.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, cost: true },
    }),
  ])

  return (
    <PurchaseStockForm
      shops={shops}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        cost: p.cost ? Number(p.cost) : null,
      }))}
    />
  )
}

import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { PurchaseStockForm } from "@/components/admin/purchase-stock-form"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonTable } from "@/components/shared/skeletons"

export const metadata = { title: "Purchase Stock | RetailCore" }

export default async function PurchaseStockPage() {
  await requireRole("ADMIN")

  return (
    <Suspense fallback={<PurchaseStockSkeleton />}>
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

function PurchaseStockSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg p-6">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <div className="space-y-4 rounded-lg p-6">
        <Skeleton className="h-5 w-24" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
        <SkeletonTable rows={3} cols={5} />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
    </div>
  )
}


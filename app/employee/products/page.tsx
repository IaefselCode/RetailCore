import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { EmployeeProductCatalog } from "@/components/employee/product-catalog"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Products | RetailCore" }

export default async function EmployeeProductsPage() {
  const ctx = await requireEmployeeContext()

  return (
    <Suspense fallback={<ProductCatalogSkeleton />}>
      <EmployeeProductsContent shopId={ctx.shopId} />
    </Suspense>
  )
}

async function EmployeeProductsContent({ shopId }: { shopId: string }) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      category: { select: { name: true } },
      inventory: { where: { shopId }, select: { quantity: true } },
    },
  })

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    stock: p.inventory[0]?.quantity ?? 0,
    categoryName: p.category?.name ?? null,
    description: p.description,
  }))

  return <EmployeeProductCatalog products={rows} />
}

function ProductCatalogSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-1.5 h-7 w-52" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-full sm:max-w-sm" />
        <Skeleton className="h-9 w-36" />
        <div className="flex gap-1">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}


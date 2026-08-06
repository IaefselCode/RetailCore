import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { EmployeeProductCatalog } from "@/components/employee/product-catalog"
import {
  CardGridSkeleton,
  SearchBarSkeleton,
} from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Products | RetailCore" }

export default async function EmployeeProductsPage() {
  const ctx = await requireEmployeeContext()

  return (
    <Suspense fallback={<ProductCatalogSkeleton />}>
      <EmployeeProductsContent shopId={ctx.shopId} />
    </Suspense>
  )
}

function ProductCatalogSkeleton() {
  // Mirrors EmployeeProductCatalog's exact arrangement: heading,
  // toolbar (search + select + view toggle), product card grid.
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-52" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBarSkeleton className="w-full flex-1 sm:max-w-sm" />
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>

      <CardGridSkeleton count={8} />
    </div>
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

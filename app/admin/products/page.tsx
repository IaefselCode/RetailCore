import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import Link from "next/link"
import { CirclePlus, Package } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SkeletonKpiGrid, SkeletonTable } from "@/components/shared/skeletons"
import { ProductsTable } from "@/components/admin/products-table"

export const metadata = { title: "Products | RetailCore" }

interface SearchParams {
  search?: string
  category?: string
  status?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole("ADMIN")
  const params = await searchParams

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Home <span className="mx-1">/</span> <span className="text-foreground">Products</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Product Catalog</h1>
        <Link href="/admin/products/add">
          <AnimateButton variant="accent">
            <CirclePlus className="size-4" />
            Add Product
          </AnimateButton>
        </Link>
      </div>

      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsContent searchParams={params} />
      </Suspense>
    </div>
  )
}

async function ProductsContent({ searchParams }: { searchParams: SearchParams }) {
  const where = {
    ...(searchParams.search
      ? {
          OR: [
            { name: { contains: searchParams.search, mode: "insensitive" as const } },
            { sku: { contains: searchParams.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(searchParams.category && searchParams.category !== "all"
      ? { categoryId: searchParams.category }
      : {}),
    ...(searchParams.status === "active"
      ? { isActive: true }
      : searchParams.status === "inactive"
      ? { isActive: false }
      : {}),
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        inventory: { select: { quantity: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])

  const total = products.length
  const active = products.filter((p) => p.isActive).length
  const inactive = products.filter((p) => !p.isActive).length

  const productRows = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    cost: p.cost ? Number(p.cost) : null,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    totalStock: p.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
  }))

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Package className="size-5 text-muted-foreground" /> {total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactive}</div>
          </CardContent>
        </Card>
      </div>

      <ProductsTable
        products={productRows}
        categories={categories}
        initialSearch={searchParams.search ?? ""}
        initialCategory={searchParams.category ?? "all"}
        initialStatus={searchParams.status ?? "all"}
      />
    </>
  )
}

function ProductsSkeleton() {
  return (
    <>
      <SkeletonKpiGrid count={3} />
      <SkeletonTable rows={6} cols={7} toolbar />
    </>
  )
}


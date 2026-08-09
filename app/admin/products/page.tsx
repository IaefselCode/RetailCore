import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { CirclePlus, Package } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductsTable } from "@/components/admin/products-table"
import {
  SearchBarSkeleton,
  SkeletonStat,
  SkeletonTable,
} from "@/components/shared/skeleton-primitives"

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
  const t = await getTranslations("products")
  const tc = await getTranslations("common")
  const params = await searchParams

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        {tc("home")} <span className="mx-1">/</span> <span className="text-foreground">{t("breadcrumb")}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link href="/admin/products/add">
          <AnimateButton variant="accent">
            <CirclePlus className="size-4" />
            {t("addProduct")}
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
  const t = await getTranslations("products")
  // All products are fetched server-side; search/category/status filtering is
  // handled client-side by the TanStack table (seeded from URL params).
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        inventory: { select: { quantity: true, shop: { select: { id: true, name: true } } } },
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
    shops: p.inventory.map((inv) => ({ id: inv.shop.id, name: inv.shop.name })),
  }))

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Package className="size-5 text-muted-foreground" /> {total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("active")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("inactive")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactive}</div>
          </CardContent>
        </Card>
      </div>

      <ProductsTable
        key={`${searchParams.search ?? ""}|${searchParams.category ?? "all"}|${searchParams.status ?? "all"}`}
        products={productRows}
        categories={categories}
        initialSearch={searchParams.search ?? ""}
        initialStatus={searchParams.status ?? "all"}
        initialCategoryId={searchParams.category}
      />
    </>
  )
}

function ProductsSkeleton() {
  // Mirrors ProductsContent's exact arrangement: KPI cards + toolbar + table.
  return (
    <>
      {/* KPI cards (data area) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["Total Products", "Active", "Inactive"].map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <SkeletonStat className="h-7 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar: search + 2 selects (mirrors ProductsTable) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBarSkeleton className="flex-1 sm:max-w-sm" />
        <Skeleton className="h-9 w-full rounded-md sm:w-40" />
        <Skeleton className="h-9 w-full rounded-md sm:w-32" />
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>

      {/* Products table (data area) */}
      <SkeletonTable
        rows={6}
        columns={["w-40", "w-20", "w-20", "w-28", "w-16", "w-10", "w-16", "w-40"]}
        headers={["Product", "SKU", "Category", "Shops", "Price", "Stock", "Status", "Actions"]}
      />
    </>
  )
}

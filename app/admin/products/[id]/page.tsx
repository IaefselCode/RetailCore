import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { ProductDetailActions } from "@/components/admin/product-detail-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow } from "@/components/ui/table"
import { TableRowsSkeleton } from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Product Details | RetailCore" }

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContent id={id} />
    </Suspense>
  )
}

async function ProductDetailContent({ id }: { id: string }) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      inventory: {
        include: { shop: { select: { name: true } } },
        orderBy: { shop: { name: "asc" } },
      },
    },
  })

  if (!product) notFound()

  const data = {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: Number(product.price),
    cost: product.cost ? Number(product.cost) : null,
    categoryName: product.category?.name ?? null,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    totalStock: product.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
    shopStock: product.inventory.map((inv) => ({
      shopName: inv.shop.name,
      quantity: inv.quantity,
      minStock: inv.minStock,
    })),
  }

  return <ProductDetailActions product={data} />
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {["Shop", "Stock", "Min Stock"].map((h) => (
                  <TableHead key={h}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRowsSkeleton rows={4} columns={["w-32", "w-16", "w-12"]} />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

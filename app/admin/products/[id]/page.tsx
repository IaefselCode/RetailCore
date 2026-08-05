import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { ProductDetailActions } from "@/components/admin/product-detail-actions"
import { SkeletonDetail } from "@/components/shared/skeletons"

export const metadata = { title: "Product Details | RetailCore" }

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params

  return (
    <Suspense fallback={<SkeletonDetail icon />}>
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


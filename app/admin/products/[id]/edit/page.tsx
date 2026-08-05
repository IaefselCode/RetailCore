import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { EditProductForm } from "@/components/admin/edit-product-form"
import { SkeletonForm } from "@/components/shared/skeletons"

export const metadata = { title: "Edit Product | RetailCore" }

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params

  return (
    <Suspense fallback={<SkeletonForm fields={4} />}>
      <EditProductContent id={id} />
    </Suspense>
  )
}

async function EditProductContent({ id }: { id: string }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])

  if (!product) notFound()

  return (
    <EditProductForm
      product={{
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: Number(product.price),
        cost: product.cost ? Number(product.cost) : null,
        categoryId: product.categoryId,
        imageUrl: product.imageUrl,
      }}
      categories={categories}
    />
  )
}


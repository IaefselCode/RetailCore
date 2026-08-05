import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { RecordSaleForm } from "@/components/employee/record-sale-form"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonPos } from "@/components/shared/skeletons"

export const metadata = { title: "Record Sale | RetailCore" }

export default async function RecordSalePage() {
  const ctx = await requireEmployeeContext()

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <SkeletonPos />
        </div>
      }
    >
      <RecordSaleContent shopId={ctx.shopId} shopName={ctx.shopName} />
    </Suspense>
  )
}

async function RecordSaleContent({ shopId, shopName }: { shopId: string; shopName: string }) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      inventory: { where: { shopId }, select: { quantity: true } },
    },
  })

  const posProducts = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stock: p.inventory[0]?.quantity ?? 0,
    }))
    .filter((p) => p.stock > 0)

  return <RecordSaleForm products={posProducts} shopName={shopName} />
}


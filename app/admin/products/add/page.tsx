import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { AddProductWizard } from "@/components/admin/add-product-wizard"
import { WizardSkeleton } from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Add Product | RetailCore" }

export default async function AddProductPage() {
  await requireRole("ADMIN")

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground flex items-center gap-1">
        Dashboard <ChevronRight className="size-3.5" />
        <Link href="/admin/products" className="hover:text-foreground">Products</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Add Product</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold">Add Product</h1>
        <p className="text-sm text-muted-foreground">Fill in the product details across all steps</p>
      </div>

      <Suspense fallback={<WizardSkeleton steps={3} />}>
        <AddProductContent />
      </Suspense>
    </div>
  )
}

async function AddProductContent() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return <AddProductWizard categories={categories} />
}

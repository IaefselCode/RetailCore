import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { AddProductWizard } from "@/components/admin/add-product-wizard"
import { WizardSkeleton } from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Add Product | RetailCore" }

export default async function AddProductPage() {
  await requireRole("ADMIN")
  const t = await getTranslations("addProduct")
  const tn = await getTranslations("nav")
  const tc = await getTranslations("common")

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground flex items-center gap-1">
        {tc("home")} <ChevronRight className="size-3.5" />
        <Link href="/admin/products" className="hover:text-foreground">{tn("products")}</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{t("breadcrumb")}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<WizardSkeleton steps={4} />}>
        <AddProductContent />
      </Suspense>
    </div>
  )
}

async function AddProductContent() {
  const [categories, shops] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.shop.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, address: true, city: true },
    }),
  ])

  return <AddProductWizard categories={categories} shops={shops} />
}

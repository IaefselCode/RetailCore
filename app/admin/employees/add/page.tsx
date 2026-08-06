import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { Home, ChevronRight } from "lucide-react"
import Link from "next/link"
import { AddEmployeeForm } from "@/components/admin/add-employee-form"
import { FormSkeleton } from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Add Employee | RetailCore" }

export default async function AddEmployeePage() {
  await requireRole("ADMIN")
  const t = await getTranslations("addEmployee")
  const tn = await getTranslations("nav")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <Link href="/admin" className="hover:text-foreground">{tn("dashboard")}</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/admin/employees" className="hover:text-foreground">{tn("employees")}</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{t("breadcrumb")}</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<FormSkeleton fields={4} />}>
        <AddEmployeeContent />
      </Suspense>
    </div>
  )
}

async function AddEmployeeContent() {
  const shops = await prisma.shop.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return <AddEmployeeForm shops={shops} />
}

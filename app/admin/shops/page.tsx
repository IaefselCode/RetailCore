import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { Store, Home, ChevronRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ShopsTable } from "@/components/admin/shops-table"
import {
  SearchBarSkeleton,
  SkeletonStat,
  SkeletonTable,
} from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Shop Management | RetailCore" }

async function TotalShopsValue() {
  const count = await prisma.shop.count()
  return <>{count}</>
}

async function ActiveShopsValue() {
  const count = await prisma.shop.count({ where: { isActive: true } })
  return <>{count}</>
}

async function InactiveShopsValue() {
  const count = await prisma.shop.count({ where: { isActive: false } })
  return <>{count}</>
}

async function LoadedShopsTable() {
  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { employees: true } } },
  })

  const shopRows = shops.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    city: s.city,
    state: s.state,
    zipCode: s.zipCode,
    phone: s.phone,
    isActive: s.isActive,
    employeeCount: s._count.employees,
  }))

  return <ShopsTable shops={shopRows} />
}
function ShopsTableSkeleton({ headers }: { headers: string[] }) {
  // Mirrors ShopsTable's exact arrangement: search bar + table + add button.
  return (
    <div className="space-y-4">
      <SearchBarSkeleton className="sm:max-w-sm" />
      <SkeletonTable
        rows={6}
        columns={["w-32", "w-40", "w-24", "w-16", "w-8", "w-40"]}
        headers={headers}
      />
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  )
}

export default async function ShopsPage() {
  await requireRole("ADMIN")
  const t = await getTranslations("shops")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <span>Home</span>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Shops</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shop Management</h1>
        <p className="text-sm text-muted-foreground">Manage all retail locations</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Shops</CardTitle>
            <Store className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
                <TotalShopsValue />
              </Suspense>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <Store className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
                <ActiveShopsValue />
              </Suspense>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            <Store className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
                <InactiveShopsValue />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense
        fallback={
          <ShopsTableSkeleton
            headers={[
              t("colName"),
              t("colLocation"),
              t("colPhone"),
              t("colStatus"),
              t("colEmployees"),
              t("colActions"),
            ]}
          />
        }
      >
        <LoadedShopsTable />
      </Suspense>
    </div>
  )
}

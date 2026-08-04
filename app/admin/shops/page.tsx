import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { Store, Home, ChevronRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ShopsTable } from "@/components/admin/shops-table"

export const metadata = { title: "Shop Management | RetailCore" }

export default async function ShopsPage() {
  await requireRole("ADMIN")

  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { employees: true } },
    },
  })

  const activeCount = shops.filter((s) => s.isActive).length
  const inactiveCount = shops.filter((s) => !s.isActive).length

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
            <div className="text-2xl font-bold">{shops.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <Store className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            <Store className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
          </CardContent>
        </Card>
      </div>

      <ShopsTable shops={shopRows} />
    </div>
  )
}

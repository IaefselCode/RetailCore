import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { Users, Home, ChevronRight, Plus } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import Link from "next/link"
import { EmployeesTable } from "@/components/admin/employees-table"
import {
  SearchBarSkeleton,
  SkeletonStat,
  SkeletonTable,
} from "@/components/shared/skeleton-primitives"

export const metadata = { title: "Employee Management | RetailCore" }

async function TotalEmployeesValue() {
  const count = await prisma.employee.count()
  return <>{count}</>
}

async function ActiveEmployeesValue() {
  const count = await prisma.employee.count({ where: { isActive: true } })
  return <>{count}</>
}

async function InactiveEmployeesValue() {
  const count = await prisma.employee.count({ where: { isActive: false } })
  return <>{count}</>
}

async function LoadedEmployeesTable() {
  const [employees, shops] = await Promise.all([
    prisma.employee.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, isActive: true } },
        shop: { select: { name: true } },
      },
    }),
    prisma.shop.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const employeeRows = employees.map((e) => ({
    id: e.id,
    userId: e.userId,
    firstName: e.user.firstName ?? "",
    lastName: e.user.lastName ?? "",
    email: e.user.email,
    position: e.position,
    shopId: e.shopId,
    shopName: e.shop.name,
    hireDate: e.hireDate?.toISOString() ?? null,
    salary: Number(e.salary ?? 0),
    isActive: e.isActive,
  }))

  return <EmployeesTable employees={employeeRows} shops={shops} />
}
function EmployeesTableSkeleton() {
  // Mirrors EmployeesTable's exact arrangement: search bar + table.
  return (
    <div className="space-y-4">
      <SearchBarSkeleton className="sm:max-w-sm" />
      <SkeletonTable
        rows={6}
        columns={["w-40", "w-24", "w-28", "w-16", "w-24", "w-40"]}
        headers={["Employee", "Position", "Shop Assignment", "Status", "Hire Date", "Actions"]}
      />
    </div>
  )
}

export default async function EmployeesPage() {
  await requireRole("ADMIN")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <span>Home</span>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Employees</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employee Management</h1>
          <p className="text-sm text-muted-foreground">Manage all staff members</p>
        </div>
        <AnimateButton variant="accent" asChild>
          <Link href="/admin/employees/add">
            <Plus /> Add Employee
          </Link>
        </AnimateButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
                <TotalEmployeesValue />
              </Suspense>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <Users className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
                <ActiveEmployeesValue />
              </Suspense>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            <Users className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <Suspense fallback={<SkeletonStat className="h-7 w-12" />}>
                <InactiveEmployeesValue />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<EmployeesTableSkeleton />}>
        <LoadedEmployeesTable />
      </Suspense>
    </div>
  )
}

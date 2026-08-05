import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { Home, ChevronRight } from "lucide-react"
import Link from "next/link"
import { AddEmployeeForm } from "@/components/admin/add-employee-form"
import { SkeletonForm } from "@/components/shared/skeletons"

export const metadata = { title: "Add Employee | RetailCore" }

export default async function AddEmployeePage() {
  await requireRole("ADMIN")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <Link href="/admin" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/admin/employees" className="hover:text-foreground">Employees</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Add Employee</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Employee</h1>
        <p className="text-sm text-muted-foreground">Create a staff account and assign them to a shop</p>
      </div>

      <Suspense fallback={<SkeletonForm fields={4} />}>
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


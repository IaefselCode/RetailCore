import { requireEmployeeContext } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { Calendar, DollarSign, Mail, Phone, Star, Store } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "@/components/employee/profile-form"
import { formatMoney } from "@/lib/money"

export const metadata = { title: "Profile | RetailCore" }

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function yearsOfService(hireDate: Date | null): number | null {
  if (!hireDate) return null
  const now = new Date()
  let years = now.getFullYear() - hireDate.getFullYear()
  const beforeAnniversary =
    now.getMonth() < hireDate.getMonth() ||
    (now.getMonth() === hireDate.getMonth() && now.getDate() < hireDate.getDate())
  if (beforeAnniversary) years -= 1
  return Math.max(0, years)
}

export default async function EmployeeProfilePage() {
  const ctx = await requireEmployeeContext()
  const t = await getTranslations("employeeProfile")

  const [user, monthAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        imageUrl: true,
      },
    }),
    prisma.sale.aggregate({
      where: {
        employeeId: ctx.employeeId,
        status: "COMPLETED",
        createdAt: { gte: startOfMonth(new Date()) },
      },
      _sum: { total: true },
    }),
  ])

  if (!user) return null

  const employee = await prisma.employee.findUnique({
    where: { userId: ctx.userId },
    select: { hireDate: true },
  })

  const years = yearsOfService(employee?.hireDate ?? null)
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Editable profile */}
      <ProfileForm
        user={{
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email,
          phone: user.phone,
          imageUrl: user.imageUrl,
        }}
      />

      {/* Contact information (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("contactInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Mail className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("email")}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Phone className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("phone")}</p>
              <p className="text-sm text-muted-foreground">{user.phone ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Store className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("shopAssignment")}</p>
              <p className="text-sm text-muted-foreground">{ctx.shopName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity stats — live from the database */}
      <Card>
        <CardHeader>
          <CardTitle>{t("activityStats")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                <DollarSign className="size-4" />
              </div>
              <p className="text-sm font-medium">{t("totalSalesThisMonth")}</p>
            </div>
            <span className="text-lg font-bold">{formatMoney(monthAgg._sum.total ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <Calendar className="size-4" />
              </div>
              <p className="text-sm font-medium">{t("yearsOfService")}</p>
            </div>
            <span className="text-lg font-bold">{years ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <Star className="size-4" />
              </div>
              <p className="text-sm font-medium">{t("rating")}</p>
            </div>
            <span className="text-lg font-bold">—</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
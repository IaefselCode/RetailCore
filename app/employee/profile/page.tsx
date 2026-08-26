import { requireEmployeeContext } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { Calendar, DollarSign, Mail, PenLine, Phone, Store } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney, getSystemCurrency } from "@/lib/money"

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
  const currency = await getSystemCurrency()

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
  const initials =
    [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar className="size-24">
              {user.imageUrl ? (
                <AvatarImage src={user.imageUrl} alt={`${user.firstName} ${user.lastName}`} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-semibold tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/employee/profile/edit">
                    <PenLine className="mr-2 size-4" />
                    {t("editProfile")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("contactInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("email")}</p>
                <p className="truncate text-sm font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Phone className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("phone")}</p>
                <p className="truncate text-sm font-medium">{user.phone ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 sm:col-span-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Store className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("shopAssignment")}</p>
                <p className="truncate text-sm font-medium">{ctx.shopName}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t("activityStats")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                <DollarSign className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("totalSalesThisMonth")}</p>
                <p className="text-lg font-bold">{formatMoney(monthAgg._sum.total ?? 0, currency)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <Calendar className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("yearsOfService")}</p>
                <p className="text-lg font-bold">{years ?? "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

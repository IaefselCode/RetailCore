import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ChevronRight, ArrowLeft, Mail, Phone, Store } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EmployeeSalesTable } from "@/components/admin/employee-sales-table"
import { EmployeePerformance, type PeriodStats } from "@/components/admin/employee-performance"
import Link from "next/link"
import { formatMoney, getSystemCurrency } from "@/lib/money"

export const metadata = { title: "Employee Details | RetailCore" }

export default async function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const t = await getTranslations("employeeDetail")
  const tc = await getTranslations("common")
  const currency = await getSystemCurrency()
  const { id } = await params

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: true,
      shop: true,
      sales: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          invoiceNo: true,
          customerName: true,
          total: true,
          totalCost: true,
          totalProfit: true,
          discount: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          _count: { select: { items: true } },
          items: { select: { quantity: true } },
        },
      },
    },
  })

  if (!employee) notFound()

  const { user, shop, sales } = employee

  const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"

  // ---------- helpers ----------
  function startOfDay(d: Date) {
    const r = new Date(d)
    r.setHours(0, 0, 0, 0)
    return r
  }
  function startOfWeek(d: Date) {
    const r = new Date(d)
    const day = r.getDay()
    r.setDate(r.getDate() - day)
    r.setHours(0, 0, 0, 0)
    return r
  }
  function startOfMonth(d: Date) {
    const r = new Date(d)
    r.setDate(1)
    r.setHours(0, 0, 0, 0)
    return r
  }
  function startOfYear(d: Date) {
    const r = new Date(d)
    r.setMonth(0, 1)
    r.setHours(0, 0, 0, 0)
    return r
  }
  function subDays(d: Date, n: number) {
    const r = new Date(d)
    r.setDate(r.getDate() - n)
    return r
  }

  const now = new Date()

  function computeStats(from: Date, prevFrom: Date): PeriodStats {
    const inRange = sales.filter((s) => s.createdAt >= from)
    const prevInRange = sales.filter((s) => s.createdAt >= prevFrom && s.createdAt < from)

    const completed = inRange.filter((s) => s.status === "COMPLETED")
    const prevCompleted = prevInRange.filter((s) => s.status === "COMPLETED")

    const revenue = completed.reduce((s, x) => s + Number(x.total), 0)
    const profit = completed.reduce((s, x) => s + Number(x.totalProfit), 0)
    const cost = completed.reduce((s, x) => s + Number(x.totalCost), 0)
    const totalDiscount = completed.reduce((s, x) => s + Number(x.discount), 0)
    const itemsSold = inRange.reduce((s, x) => s + x.items.reduce((a, b) => a + b.quantity, 0), 0)

    const prevRevenue = prevCompleted.reduce((s, x) => s + Number(x.total), 0)
    const prevProfit = prevCompleted.reduce((s, x) => s + Number(x.totalProfit), 0)

    const paymentMethods: Record<string, number> = {}
    for (const s of inRange) {
      const pm = s.paymentMethod ?? "other"
      paymentMethods[pm] = (paymentMethods[pm] ?? 0) + 1
    }

    return {
      revenue,
      profit,
      cost,
      totalDiscount,
      salesCount: inRange.length,
      completedCount: completed.length,
      cancelledCount: inRange.filter((s) => s.status === "CANCELLED").length,
      voidedCount: inRange.filter((s) => s.status === "VOIDED").length,
      itemsSold,
      avgOrderValue: completed.length > 0 ? revenue / completed.length : 0,
      avgItemsPerSale: inRange.length > 0 ? itemsSold / inRange.length : 0,
      paymentMethods,
      prevRevenue,
      prevProfit,
      prevSalesCount: prevInRange.length,
    }
  }

  const todayStart = startOfDay(now)
  const yesterdayStart = subDays(todayStart, 1)
  const weekStart = startOfWeek(now)
  const lastWeekStart = subDays(weekStart, 7)
  const monthStart = startOfMonth(now)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const yearStart = startOfYear(now)
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)

  const perfData = {
    today: computeStats(todayStart, yesterdayStart),
    week: computeStats(weekStart, lastWeekStart),
    month: computeStats(monthStart, lastMonthStart),
    year: computeStats(yearStart, lastYearStart),
    allTime: computeStats(new Date(0), new Date(0)),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin/employees" className="hover:text-foreground">{t("breadcrumb")}</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{user.firstName} {user.lastName}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{employee.position ?? t("employee")}</span>
              <span className="text-border">|</span>
              <span>{shop.name}</span>
              <Badge variant={employee.isActive ? "default" : "secondary"}>
                {employee.isActive ? tc("active") : tc("inactive")}
              </Badge>
            </div>
          </div>
        </div>
        <AnimateButton variant="outline" asChild>
          <Link href="/admin/employees">
            <ArrowLeft /> {t("backToEmployees")}
          </Link>
        </AnimateButton>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="performance">{t("performance")}</TabsTrigger>
          <TabsTrigger value="sales-history">{t("salesHistory")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("personalInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("fullName")}</p>
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("position")}</p>
                  <p className="text-sm font-medium">{employee.position ?? "â€”"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("hireDate")}</p>
                  <p className="text-sm font-medium">
                    {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "â€”"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("salary")}</p>
                  <p className="text-sm font-medium">{formatMoney(employee.salary, currency)}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">{t("contact")}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                    {user.email}
                  </a>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <a href={`tel:${user.phone}`} className="text-primary hover:underline">
                      {user.phone}
                    </a>
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">{t("shopAssignment")}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Store className="size-4 text-muted-foreground" />
                  <Link href={`/admin/shops/${shop.id}`} className="hover:underline">
                    {shop.name}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <EmployeePerformance
            today={perfData.today}
            week={perfData.week}
            month={perfData.month}
            year={perfData.year}
            allTime={perfData.allTime}
          />
        </TabsContent>

        <TabsContent value="sales-history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("salesHistory")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <EmployeeSalesTable
                cardless
                rows={sales.map((sale) => ({
                  id: sale.id,
                  invoiceNo: sale.invoiceNo,
                  customerName: sale.customerName,
                  items: sale._count.items,
                  total: Number(sale.total),
                  discount: Number(sale.discount),
                  paymentMethod: sale.paymentMethod,
                  createdAt: sale.createdAt,
                  status: sale.status,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ChevronRight, ArrowLeft, Mail, Store, Briefcase, TrendingUp } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ServerTable, createServerColumnHelper } from "@/components/shared/server-table"
import Link from "next/link"
import { formatMoney } from "@/lib/money"

export const metadata = { title: "Employee Details | RetailCore" }

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
}

const STATUS_KEYS: Record<string, string> = {
  COMPLETED: "completed",
  PENDING: "pending",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
}

interface EmpSaleRow {
  id: string
  invoiceNo: string
  customerName: string | null
  items: number
  total: number
  paymentMethod: string | null
  createdAt: Date
  status: string
}

const empSaleHelper = createServerColumnHelper<EmpSaleRow>()

export default async function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const t = await getTranslations("employeeDetail")
  const tc = await getTranslations("common")
  const { id } = await params

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: true,
      shop: true,
      sales: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          invoiceNo: true,
          customerName: true,
          total: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      },
    },
  })

  if (!employee) notFound()

  const { user, shop, sales } = employee

  const totalRevenue = sales
    .filter((s) => s.status === "COMPLETED")
    .reduce((sum, s) => sum + Number(s.total), 0)

  const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"

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
                  <p className="text-sm font-medium">{employee.position ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("hireDate")}</p>
                  <p className="text-sm font-medium">
                    {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("salary")}</p>
                  <p className="text-sm font-medium">{formatMoney(employee.salary)}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">{t("contact")}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  {user.email}
                </div>
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

        <TabsContent value="performance" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalSales")}</CardTitle>
                <Briefcase className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sales.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("revenueGenerated")}</CardTitle>
                <TrendingUp className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoney(totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("completed")}</CardTitle>
                <TrendingUp className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sales.filter((s) => s.status === "COMPLETED").length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales-history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("salesHistory")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <EmployeeSalesTable sales={sales} t={t} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmployeeSalesTable({
  sales,
  t,
}: {
  sales: {
    id: string
    invoiceNo: string
    customerName: string | null
    total: number | { toString(): string }
    paymentMethod: string | null
    status: string
    createdAt: Date
    _count: { items: number }
  }[]
  t: (key: string) => string
}) {
  const rows: EmpSaleRow[] = sales.map((sale) => ({
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    customerName: sale.customerName,
    items: sale._count.items,
    total: Number(sale.total),
    paymentMethod: sale.paymentMethod,
    createdAt: sale.createdAt,
    status: sale.status,
  }))

  const columns = empSaleHelper.columns([
    empSaleHelper.accessor("invoiceNo", {
      header: t("colInvoice"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
    }),
    empSaleHelper.accessor("customerName", {
      header: t("colCustomer"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    empSaleHelper.accessor("items", { header: t("colItems"), cell: ({ getValue }) => getValue() as number }),
    empSaleHelper.accessor("total", {
      header: t("colAmount"),
      cell: ({ getValue }) => <span className="font-medium">{formatMoney(getValue() as number)}</span>,
    }),
    empSaleHelper.accessor("paymentMethod", {
      header: t("colPayment"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    empSaleHelper.accessor("createdAt", {
      header: t("colDate"),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{(getValue() as Date).toLocaleDateString()}</span>
      ),
    }),
    empSaleHelper.accessor("status", {
      header: t("colStatus"),
      cell: ({ getValue }) => (
        <Badge variant={statusVariant[getValue() as string] ?? "default"}>
          {t(STATUS_KEYS[getValue() as string] ?? (getValue() as string))}
        </Badge>
      ),
    }),
  ])

  return (
    <ServerTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      empty={t("noSales")}
    />
  )
}

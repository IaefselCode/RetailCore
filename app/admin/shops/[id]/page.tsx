import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Store, MapPin, DollarSign, ShoppingCart, Users, Package, ArrowLeft, ChevronRight, Home, Mail } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { ServerTable, createServerColumnHelper } from "@/components/shared/server-table"
import Link from "next/link"
import { formatMoney } from "@/lib/money"

export const metadata = { title: "Shop Details | RetailCore" }

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  CANCELLED: "destructive",
  VOIDED: "destructive",
}

const STATUS_KEYS: Record<string, string> = {
  COMPLETED: "completed",
  PENDING: "pending",
  CANCELLED: "cancelled",
  VOIDED: "voided",
}

interface ShopEmployeeRow {
  id: string
  name: string
  position: string | null
  email: string
  isActive: boolean
}

interface ShopSaleRow {
  id: string
  invoiceNo: string
  customerName: string | null
  employeeName: string
  total: number
  paymentMethod: string | null
  createdAt: Date
  status: string
}

const empHelper = createServerColumnHelper<ShopEmployeeRow>()
const saleHelper = createServerColumnHelper<ShopSaleRow>()

export default async function ShopDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const t = await getTranslations("shopDetail")
  const tc = await getTranslations("common")
  const { id } = await params

  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      employees: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, isActive: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      sales: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          invoiceNo: true,
          customerName: true,
          total: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          employee: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      _count: { select: { employees: true, sales: true, inventory: true } },
    },
  })

  if (!shop) notFound()

  const revenue = await prisma.sale.aggregate({
    where: { shopId: id, status: "COMPLETED" },
    _sum: { total: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <Link href="/admin" className="hover:text-foreground">{t("home")}</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/admin/shops" className="hover:text-foreground">{t("shops")}</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{shop.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
            <Store className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{shop.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {(shop.city || shop.address) && (
                <>
                  <MapPin className="size-3.5" />
                  {[shop.city, shop.address].filter(Boolean).join(", ")}
                </>
              )}
              <Badge variant={shop.isActive ? "default" : "secondary"}>
                {shop.isActive ? tc("active") : tc("inactive")}
              </Badge>
            </div>
          </div>
        </div>
        <AnimateButton variant="outline" asChild>
          <Link href="/admin/shops">
            <ArrowLeft /> {t("backToShops")}
          </Link>
        </AnimateButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("revenue")}</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(revenue._sum.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalSales")}</CardTitle>
            <ShoppingCart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shop._count.sales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("employees")}</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shop._count.employees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("stockItems")}</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shop._count.inventory}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("employeesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ShopEmployeesTable
            employees={shop.employees}
            t={t}
            tc={tc}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentTransactions")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ShopSalesTable
            sales={shop.sales}
            t={t}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function ShopEmployeesTable({
  employees,
  t,
  tc,
}: {
  employees: {
    id: string
    position: string | null
    isActive: boolean
    user: { firstName: string | null; lastName: string | null; email: string }
  }[]
  t: (key: string) => string
  tc: (key: string) => string
}) {
  const rows: ShopEmployeeRow[] = employees.map((emp) => ({
    id: emp.id,
    name: `${emp.user.firstName ?? ""} ${emp.user.lastName ?? ""}`.trim(),
    position: emp.position,
    email: emp.user.email,
    isActive: emp.isActive,
  }))

  const columns = empHelper.columns([
    empHelper.accessor("name", {
      header: t("colName"),
      cell: ({ row }) => (
        <Link href={`/admin/employees/${row.original.id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    }),
    empHelper.accessor("position", {
      header: t("colPosition"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    empHelper.accessor("email", {
      header: t("colEmail"),
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Mail className="size-3" />
          {getValue() as string}
        </div>
      ),
    }),
    empHelper.accessor("isActive", {
      header: t("colStatus"),
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? "default" : "secondary"}>
          {getValue() ? tc("active") : tc("inactive")}
        </Badge>
      ),
    }),
  ])

  return (
    <ServerTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      empty={t("noEmployees")}
    />
  )
}

function ShopSalesTable({
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
    employee: { user: { firstName: string | null; lastName: string | null } } | null
  }[]
  t: (key: string) => string
}) {
  const rows: ShopSaleRow[] = sales.map((sale) => ({
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    customerName: sale.customerName,
    employeeName: sale.employee
      ? `${sale.employee.user.firstName ?? ""} ${sale.employee.user.lastName ?? ""}`.trim()
      : "",
    total: Number(sale.total),
    paymentMethod: sale.paymentMethod,
    createdAt: sale.createdAt,
    status: sale.status,
  }))

  const columns = saleHelper.columns([
    saleHelper.accessor("invoiceNo", {
      header: t("colInvoice"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
    }),
    saleHelper.accessor("customerName", {
      header: t("colCustomer"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    saleHelper.accessor("employeeName", {
      header: t("colEmployee"),
      cell: ({ getValue }) => (getValue() as string) || "—",
    }),
    saleHelper.accessor("total", {
      header: t("colAmount"),
      cell: ({ getValue }) => <span className="font-medium">{formatMoney(getValue() as number)}</span>,
    }),
    saleHelper.accessor("paymentMethod", {
      header: t("colPayment"),
      cell: ({ getValue }) => (getValue() as string | null) ?? "—",
    }),
    saleHelper.accessor("createdAt", {
      header: t("colDate"),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{(getValue() as Date).toLocaleDateString()}</span>
      ),
    }),
    saleHelper.accessor("status", {
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

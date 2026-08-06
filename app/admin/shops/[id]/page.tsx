import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Store, MapPin, DollarSign, ShoppingCart, Users, Package, ArrowLeft, ChevronRight, Home, Mail } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import Link from "next/link"
import { formatMoney } from "@/lib/money"

export const metadata = { title: "Shop Details | RetailCore" }

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colName")}</TableHead>
                  <TableHead>{t("colPosition")}</TableHead>
                  <TableHead>{t("colEmail")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shop.employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      {t("noEmployees")}
                    </TableCell>
                  </TableRow>
                )}
                {shop.employees.map((emp) => (
                  <TableRow key={emp.id} className="transition-colors hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/admin/employees/${emp.id}`} className="font-medium hover:underline">
                        {emp.user.firstName} {emp.user.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{emp.position ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="size-3" />
                        {emp.user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.isActive ? "default" : "secondary"}>
                        {emp.isActive ? tc("active") : tc("inactive")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentTransactions")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colInvoice")}</TableHead>
                  <TableHead>{t("colCustomer")}</TableHead>
                  <TableHead>{t("colEmployee")}</TableHead>
                  <TableHead>{t("colAmount")}</TableHead>
                  <TableHead>{t("colPayment")}</TableHead>
                  <TableHead>{t("colDate")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shop.sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      {t("noSales")}
                    </TableCell>
                  </TableRow>
                )}
                {shop.sales.map((sale) => (
                  <TableRow key={sale.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{sale.invoiceNo}</TableCell>
                    <TableCell>{sale.customerName ?? "—"}</TableCell>
                    <TableCell>
                      {sale.employee
                        ? `${sale.employee.user.firstName} ${sale.employee.user.lastName}`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{formatMoney(sale.total)}</TableCell>
                    <TableCell>{sale.paymentMethod ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[sale.status] ?? "default"}>
                        {t(STATUS_KEYS[sale.status] ?? sale.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

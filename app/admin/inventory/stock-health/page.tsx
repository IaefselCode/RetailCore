import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { XCircle, AlertTriangle, Package, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildStockHealth } from "@/lib/stock-health"

export const metadata = { title: "Stock Health | RetailCore" }

function pct(n: number, total: number) {
  return `${(total > 0 ? (n / total) * 100 : 0).toFixed(1)}%`
}

export default async function StockHealthPage() {
  await requireRole("ADMIN")
  const t = await getTranslations("stockHealth")
  const ti = await getTranslations("inventory")
  const tc = await getTranslations("common")

  const inventory = await prisma.inventory.findMany({
    include: {
      product: { select: { name: true, sku: true } },
      shop: { select: { id: true, name: true } },
    },
  })

  const { perShop, totals, byStatus } = buildStockHealth(inventory)

  const stats = [
    { label: t("outOfStock"), value: totals.out, icon: XCircle, color: "text-red-600" },
    { label: t("lowStock"), value: totals.low, icon: AlertTriangle, color: "text-yellow-600" },
    { label: t("overstocked"), value: totals.over, icon: Package, color: "text-blue-600" },
    { label: t("healthy"), value: totals.healthy, icon: CheckCircle2, color: "text-green-600" },
  ]

  const attentionGroups = [
    {
      key: "out" as const,
      title: t("outOfStock"),
      variant: "destructive" as const,
      badgeClass: "",
      rows: byStatus.out,
    },
    {
      key: "low" as const,
      title: t("lowStock"),
      variant: "secondary" as const,
      badgeClass: "",
      rows: byStatus.low,
    },
    {
      key: "over" as const,
      title: t("overstocked"),
      variant: "outline" as const,
      badgeClass: "text-blue-600",
      rows: byStatus.over,
    },
  ]

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        {tc("home")} <span className="mx-1">/</span>
        <Link href="/admin/inventory" className="hover:text-foreground">{ti("breadcrumb")}</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{t("breadcrumb")}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("desc")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`size-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{t("itemsLabel")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("perShopTitle")}</CardTitle>
          <CardDescription>{t("perShopDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {perShop.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colShop")}</TableHead>
                  <TableHead className="text-right">{t("colOut")}</TableHead>
                  <TableHead className="text-right">{t("colLow")}</TableHead>
                  <TableHead className="text-right">{t("colOver")}</TableHead>
                  <TableHead className="text-right">{t("colHealthy")}</TableHead>
                  <TableHead className="text-right">{t("colTotal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perShop.map((row) => (
                  <TableRow key={row.shopId}>
                    <TableCell>
                      <div>
                        <Link
                          href={`/admin/inventory?shopId=${row.shopId}`}
                          className="font-medium hover:underline"
                        >
                          {row.shopName}
                        </Link>
                        <div className="mt-1.5 flex h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                          <div className="bg-red-600" style={{ width: pct(row.out, row.total) }} />
                          <div className="bg-yellow-500" style={{ width: pct(row.low, row.total) }} />
                          <div className="bg-blue-600" style={{ width: pct(row.over, row.total) }} />
                          <div className="bg-green-600" style={{ width: pct(row.healthy, row.total) }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-red-600">{row.out}</TableCell>
                    <TableCell className="text-right tabular-nums text-yellow-600">{row.low}</TableCell>
                    <TableCell className="text-right tabular-nums text-blue-600">{row.over}</TableCell>
                    <TableCell className="text-right tabular-nums text-green-600">{row.healthy}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{row.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-medium">{t("colTotal")}</TableCell>
                  <TableCell className="text-right tabular-nums text-red-600">{totals.out}</TableCell>
                  <TableCell className="text-right tabular-nums text-yellow-600">{totals.low}</TableCell>
                  <TableCell className="text-right tabular-nums text-blue-600">{totals.over}</TableCell>
                  <TableCell className="text-right tabular-nums text-green-600">{totals.healthy}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{totals.total}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("attentionTitle")}</CardTitle>
          <CardDescription>{t("attentionDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {byStatus.out.length + byStatus.low.length + byStatus.over.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("attentionEmpty")}</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {attentionGroups.map((g) => (
                <div key={g.key}>
                  <p className="mb-3 flex items-center justify-between text-sm font-medium">
                    {g.title}
                    <Badge variant={g.variant} className={g.badgeClass}>{g.rows.length}</Badge>
                  </p>
                  {g.rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">—</p>
                  ) : (
                    <div className="space-y-2.5">
                      {g.rows.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.productName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.shopName} · {item.sku}
                            </p>
                          </div>
                          <Badge variant={g.variant} className={`shrink-0 ${g.badgeClass}`}>
                            {item.quantity}
                            {item.statusKey === "statusOver" ? ` / ${item.maxStock}` : ` / ${item.minStock}`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import { Table, TableHeader, TableBody, TableHead, TableRow } from "@/components/ui/table"
import { TableRowsSkeleton } from "@/components/shared/skeleton-primitives"
import { ServerTable, createServerColumnHelper } from "@/components/shared/server-table"

export const metadata = { title: "Inventory | RetailCore" }

function stockStatusKey(quantity: number, minStock: number) {
  if (quantity <= 0) return "statusOut"
  if (quantity <= minStock) return "statusLow"
  if (quantity <= minStock * 2) return "statusCritical"
  return "statusIn"
}

function statusVariant(key: string): "outline" | "secondary" | "destructive" | "default" {
  if (key === "statusOut") return "outline"
  if (key === "statusLow") return "secondary"
  if (key === "statusCritical") return "destructive"
  return "default"
}

interface EmpInventoryRow {
  id: string
  productName: string
  sku: string
  quantity: number
  price: number
  statusKey: string
  statusVariant: "outline" | "secondary" | "destructive" | "default"
}

const invHelper = createServerColumnHelper<EmpInventoryRow>()

async function InventoryTableSection({ shopId }: { shopId: string }) {
  const t = await getTranslations("employeeInventory")
  const tc = await getTranslations("common")
  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">{tc("no")}</TableHead>
              <TableHead>{t("colProduct")}</TableHead>
              <TableHead>{t("colSku")}</TableHead>
              <TableHead>{t("colShopStock")}</TableHead>
              <TableHead>{t("colPrice")}</TableHead>
              <TableHead>{t("colStatus")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Suspense
              fallback={
                <TableRowsSkeleton
                  rows={10}
                  columns={["w-8", "w-32", "w-20", "w-10", "w-16", "w-20"]}
                />
              }
            >
              <InventoryRows shopId={shopId} />
            </Suspense>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

async function InventoryRows({ shopId }: { shopId: string }) {
  const t = await getTranslations("employeeInventory")
  const inventory = await prisma.inventory.findMany({
    where: { shopId },
    orderBy: { product: { name: "asc" } },
    include: {
      product: {
        select: { name: true, sku: true, price: true, isActive: true },
      },
    },
  })

  const activeItems = inventory.filter((i) => i.product.isActive)

  const rows: EmpInventoryRow[] = activeItems.map((item) => {
    const statusKey = stockStatusKey(item.quantity, item.minStock)
    return {
      id: item.id,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      price: Number(item.product.price),
      statusKey,
      statusVariant: statusVariant(statusKey),
    }
  })

  const columns = invHelper.columns([
    invHelper.accessor("productName", {
      header: t("colProduct"),
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    }),
    invHelper.accessor("sku", {
      header: t("colSku"),
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() as string}</span>,
    }),
    invHelper.accessor("quantity", { header: t("colShopStock"), cell: ({ getValue }) => getValue() as number }),
    invHelper.accessor("price", {
      header: t("colPrice"),
      cell: ({ getValue }) => formatMoney(getValue() as number),
    }),
    invHelper.accessor("statusKey", {
      header: t("colStatus"),
      cell: ({ row }) => <Badge variant={row.original.statusVariant}>{t(row.original.statusKey)}</Badge>,
    }),
  ])

  return (
    <ServerTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      numbered
      empty={t("empty")}
      bodyOnly
    />
  )
}

export default async function EmployeeInventoryPage() {
  const ctx = await requireEmployeeContext()
  const t = await getTranslations("employeeInventory")

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{t("breadcrumb")}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{ctx.shopName}</p>
      </div>

      <InventoryTableSection shopId={ctx.shopId} />
    </div>
  )
}

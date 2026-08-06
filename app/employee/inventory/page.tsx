import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/money"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { TableRowsSkeleton } from "@/components/shared/skeleton-primitives"

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

async function InventoryTableSection({ shopId }: { shopId: string }) {
  const t = await getTranslations("employeeInventory")
  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
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
                  columns={["w-32", "w-20", "w-10", "w-16", "w-20"]}
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

  return (
    <>
      {activeItems.length === 0 && (
        <TableRow>
          <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </TableCell>
        </TableRow>
      )}
      {activeItems.map((item) => {
        const statusKey = stockStatusKey(item.quantity, item.minStock)
        return (
          <TableRow key={item.id} className="transition-colors hover:bg-muted/50">
            <TableCell className="font-medium">{item.product.name}</TableCell>
            <TableCell className="text-muted-foreground">{item.product.sku}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{formatMoney(item.product.price)}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(statusKey)}>{t(statusKey)}</Badge>
            </TableCell>
          </TableRow>
        )
      })}
    </>
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

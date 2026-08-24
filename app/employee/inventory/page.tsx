import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
import { getTranslations } from "next-intl/server"
import { EmployeeInventoryTable } from "@/components/employee/inventory-table"
import { stockStatusKey } from "@/lib/stock-status"

export const metadata = { title: "Inventory | RetailCore" }

export default async function EmployeeInventoryPage() {
  const ctx = await requireEmployeeContext()
  const t = await getTranslations("employeeInventory")

  const inventory = await prisma.inventory.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { product: { name: "asc" } },
    include: {
      product: {
        select: { name: true, sku: true, price: true, isActive: true },
      },
    },
  })

  const rows = inventory
    .filter((i) => i.product.isActive)
    .map((item) => ({
      id: item.id,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      price: Number(item.product.price),
      statusKey: stockStatusKey(item.quantity, item.minStock, item.maxStock),
    }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{t("breadcrumb")}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{ctx.shopName}</p>
      </div>

      <EmployeeInventoryTable rows={rows} />
    </div>
  )
}
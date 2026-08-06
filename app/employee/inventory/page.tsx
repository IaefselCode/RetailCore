import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { requireEmployeeContext } from "@/lib/auth-utils"
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

function stockStatus(quantity: number, minStock: number) {
  if (quantity <= 0) return { label: "Out of Stock", variant: "outline" as const }
  if (quantity <= minStock) return { label: "Low Stock", variant: "secondary" as const }
  if (quantity <= minStock * 2) return { label: "Critical", variant: "destructive" as const }
  return { label: "In Stock", variant: "default" as const }
}

function InventoryTableSection({ shopId }: { shopId: string }) {
  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Shop Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
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
            No inventory at this shop
          </TableCell>
        </TableRow>
      )}
      {activeItems.map((item) => {
        const status = stockStatus(item.quantity, item.minStock)
        return (
          <TableRow key={item.id} className="transition-colors hover:bg-muted/50">
            <TableCell className="font-medium">{item.product.name}</TableCell>
            <TableCell className="text-muted-foreground">{item.product.sku}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{formatMoney(item.product.price)}</TableCell>
            <TableCell>
              <Badge variant={status.variant}>{status.label}</Badge>
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}

export default async function EmployeeInventoryPage() {
  const ctx = await requireEmployeeContext()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Inventory</p>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">{ctx.shopName}</p>
      </div>

      <InventoryTableSection shopId={ctx.shopId} />
    </div>
  )
}

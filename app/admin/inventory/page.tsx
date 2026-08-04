import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import Link from "next/link"
import { Package, AlertTriangle, XCircle, ShoppingCart, ArrowRightLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata = { title: "Inventory | RetailCore" }

function stockStatus(quantity: number, minStock: number) {
  if (quantity <= 0) return { label: "Out of Stock", variant: "destructive" as const }
  if (quantity <= minStock) return { label: "Low Stock", variant: "secondary" as const }
  return { label: "In Stock", variant: "default" as const }
}

export default async function InventoryPage() {
  await requireRole("ADMIN")

  const rows = await prisma.inventory.findMany({
    orderBy: [{ shop: { name: "asc" } }, { product: { name: "asc" } }],
    include: {
      product: { select: { name: true, sku: true } },
      shop: { select: { name: true } },
    },
  })

  const totalItems = rows.reduce((sum, r) => sum + r.quantity, 0)
  const lowStock = rows.filter((r) => r.quantity > 0 && r.quantity <= r.minStock).length
  const outOfStock = rows.filter((r) => r.quantity <= 0).length
  const overstocked = rows.filter((r) => r.quantity > 100).length

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Home <span className="mx-1">/</span> <span className="text-foreground">Inventory</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Inventory Management</h1>
        <div className="flex gap-2">
          <Link href="/admin/inventory/purchase-stock">
            <AnimateButton variant="accent">
              <ShoppingCart className="size-4" />
              Purchase Stock
            </AnimateButton>
          </Link>
          <Link href="/admin/inventory/stock-distribution">
            <AnimateButton variant="outline">
              <ArrowRightLeft className="size-4" />
              Stock Distribution
            </AnimateButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Total Units</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Package className="size-5 text-muted-foreground" />
            {totalItems.toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold text-yellow-600">
            <AlertTriangle className="size-5" />
            {lowStock}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold text-red-600">
            <XCircle className="size-5" />
            {outOfStock}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Overstocked</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-blue-600">{overstocked}</CardContent>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No inventory records yet
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => {
                const status = stockStatus(row.quantity, row.minStock)
                return (
                  <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="font-medium">{row.product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.product.sku}</TableCell>
                    <TableCell>{row.shop.name}</TableCell>
                    <TableCell className="font-semibold">{row.quantity}</TableCell>
                    <TableCell>{row.minStock}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

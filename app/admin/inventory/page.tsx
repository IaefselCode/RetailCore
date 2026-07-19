"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Package, AlertTriangle, XCircle, Layers, ShoppingCart, ArrowRightLeft } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3 },
  }),
}

const inventory = [
  { id: "1", product: "SonicFlow X1 Headphones", sku: "SF-X1-001", warehouse: 30, shop: 15, total: 45, reorder: 10, status: "In Stock" },
  { id: "2", product: "QuantumCharge Pro Power Bank", sku: "QC-PB-002", warehouse: 80, shop: 40, total: 120, reorder: 20, status: "In Stock" },
  { id: "3", product: "NebulaSmart Home Hub", sku: "NS-HH-003", warehouse: 0, shop: 0, total: 0, reorder: 15, status: "Out of Stock" },
  { id: "4", product: "AeroGlide Wireless Mouse", sku: "AG-WM-004", warehouse: 150, shop: 50, total: 200, reorder: 30, status: "In Stock" },
  { id: "5", product: "PixelMax 4K Monitor", sku: "PM-4K-005", warehouse: 5, shop: 10, total: 15, reorder: 20, status: "Low Stock" },
  { id: "6", product: "EcoCharge Solar Panel", sku: "EC-SP-006", warehouse: 0, shop: 0, total: 0, reorder: 5, status: "Out of Stock" },
  { id: "7", product: "SwiftBook Pro Laptop", sku: "SB-PRO-007", warehouse: 3, shop: 5, total: 8, reorder: 10, status: "Low Stock" },
  { id: "8", product: "AquaPure Water Filter", sku: "AP-WF-008", warehouse: 0, shop: 0, total: 0, reorder: 25, status: "Out of Stock" },
]

const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive" | "ghost" | "link"; label: string }> = {
  "In Stock": { variant: "default", label: "In Stock" },
  "Low Stock": { variant: "secondary", label: "Low Stock" },
  "Out of Stock": { variant: "destructive", label: "Out of Stock" },
}

export default function InventoryPage() {
  const totalItems = inventory.reduce((sum, i) => sum + i.total, 0)
  const lowStock = inventory.filter((i) => i.status === "Low Stock").length
  const outOfStock = inventory.filter((i) => i.status === "Out of Stock").length
  const overstocked = inventory.filter((i) => i.total > 100).length

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Home <span className="mx-1">/</span> <span className="text-foreground">Inventory</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Items</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Package className="size-5 text-muted-foreground" />
            {totalItems.toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold text-yellow-600">
            <AlertTriangle className="size-5" />
            {lowStock}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Out of Stock</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold text-red-600">
            <XCircle className="size-5" />
            {outOfStock}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overstocked</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold text-blue-600">
            <Layers className="size-5" />
            {overstocked}
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Warehouse Stock</TableHead>
              <TableHead>Shop Stock</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Reorder Level</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item, i) => (
              <motion.tr
                key={item.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className="border-b transition-colors hover:bg-muted/50"
              >
                <TableCell className="font-medium">{item.product}</TableCell>
                <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                <TableCell>{item.warehouse}</TableCell>
                <TableCell>{item.shop}</TableCell>
                <TableCell className="font-semibold">{item.total}</TableCell>
                <TableCell>{item.reorder}</TableCell>
                <TableCell>
                  <Badge variant={statusConfig[item.status].variant}>{statusConfig[item.status].label}</Badge>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
            </Table>
          </div>
          </Card>
    </div>
  )
}

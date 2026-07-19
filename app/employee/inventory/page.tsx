"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { AnimateButton } from "@/components/ui/animate-button"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
}

const inventory = [
  { product: "SonicFlow X1", sku: "SF-X1-001", shopStock: 2, price: 89.99, status: "low" as const },
  { product: "PowerCharge Pro", sku: "PCP-002", shopStock: 5, price: 49.99, status: "low" as const },
  { product: "DataSync Hub", sku: "DSH-003", shopStock: 1, price: 129.99, status: "critical" as const },
  { product: "CloudMesh Gateway", sku: "CMG-004", shopStock: 25, price: 199.99, status: "in-stock" as const },
  { product: "PixelVision 4K", sku: "PV-4K-005", shopStock: 12, price: 349.99, status: "in-stock" as const },
  { product: "NanoGuard Antivirus", sku: "NG-006", shopStock: 50, price: 39.99, status: "in-stock" as const },
  { product: "EcoCharge Station", sku: "ECS-007", shopStock: 8, price: 59.99, status: "low" as const },
  { product: "SwiftRoute Pro", sku: "SRP-008", shopStock: 3, price: 179.99, status: "low" as const },
  { product: "UltraSync Watch", sku: "USW-009", shopStock: 20, price: 249.99, status: "in-stock" as const },
  { product: "HyperCool Fan", sku: "HCF-010", shopStock: 0, price: 29.99, status: "out-of-stock" as const },
]

const statusConfig = {
  "in-stock": { label: "In Stock", variant: "default" as const },
  low: { label: "Low Stock", variant: "secondary" as const },
  critical: { label: "Critical", variant: "destructive" as const },
  "out-of-stock": { label: "Out of Stock", variant: "outline" as const },
}

export default function EmployeeInventoryPage() {
  const [search, setSearch] = useState("")

  const filtered = inventory.filter(
    (item) =>
      item.product.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Inventory</p>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by SKU, Name, or Barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

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
              {filtered.map((item, i) => {
                const status = statusConfig[item.status]
                return (
                  <motion.tr
                    key={item.sku}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{item.product}</TableCell>
                    <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                    <TableCell>{item.shopStock}</TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

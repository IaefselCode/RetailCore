"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Search, CirclePlus, Package } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const products = [
  { id: "1", name: "SonicFlow X1 Headphones", sku: "SF-X1-001", category: "Electronics", price: 299.99, stock: 45, status: "Active" },
  { id: "2", name: "QuantumCharge Pro Power Bank", sku: "QC-PB-002", category: "Accessories", price: 79.99, stock: 120, status: "Active" },
  { id: "3", name: "NebulaSmart Home Hub", sku: "NS-HH-003", category: "Smart Home", price: 149.99, stock: 0, status: "Discontinued" },
  { id: "4", name: "AeroGlide Wireless Mouse", sku: "AG-WM-004", category: "Accessories", price: 49.99, stock: 200, status: "Active" },
  { id: "5", name: "PixelMax 4K Monitor", sku: "PM-4K-005", category: "Electronics", price: 599.99, stock: 15, status: "Active" },
  { id: "6", name: "EcoCharge Solar Panel", sku: "EC-SP-006", category: "Green Tech", price: 199.99, stock: 0, status: "Draft" },
  { id: "7", name: "SwiftBook Pro Laptop", sku: "SB-PRO-007", category: "Electronics", price: 1299.99, stock: 8, status: "Active" },
  { id: "8", name: "AquaPure Water Filter", sku: "AP-WF-008", category: "Home", price: 39.99, stock: 0, status: "Discontinued" },
]

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive" | "ghost" | "link"> = {
  Active: "default",
  Draft: "secondary",
  Discontinued: "destructive",
}

export default function ProductsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === "all" || p.category === category
    return matchSearch && matchCategory
  })

  const categories = [...new Set(products.map((p) => p.category))]
  const total = products.length
  const active = products.filter((p) => p.status === "Active").length
  const discontinued = products.filter((p) => p.status === "Discontinued").length

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Home <span className="mx-1">/</span> <span className="text-foreground">Products</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Product Catalog</h1>
        <Link href="/admin/products/add">
          <AnimateButton variant="accent">
            <CirclePlus className="size-4" />
            Add Product
          </AnimateButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Products</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{total}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">{active}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Discontinued</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">{discontinued}</CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <motion.div
          className="relative flex-1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </motion.div>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product, i) => (
              <motion.tr
                key={product.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                <TableCell>
                  <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Package className="size-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[product.status]}>{product.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/products/${product.id}`}>
                    <AnimateButton variant="ghost" size="sm">View</AnimateButton>
                  </Link>
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

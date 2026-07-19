"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Search, Grid3X3, List, Eye } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { AnimateButton } from "@/components/ui/animate-button"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

const categories = ["All", "Electronics", "Accessories", "Software", "Home & Office"]

const products = [
  { id: 1, name: "SonicFlow X1", price: 89.99, stock: 2, category: "Electronics", sku: "SF-X1-001", description: "High-speed wireless streaming device with low latency." },
  { id: 2, name: "PowerCharge Pro", price: 49.99, stock: 5, category: "Accessories", sku: "PCP-002", description: "Fast-charging power bank with 20,000mAh capacity." },
  { id: 3, name: "DataSync Hub", price: 129.99, stock: 1, category: "Electronics", sku: "DSH-003", description: "Central hub for syncing all your smart devices." },
  { id: 4, name: "CloudMesh Gateway", price: 199.99, stock: 25, category: "Electronics", sku: "CMG-004", description: "Mesh WiFi system for seamless home coverage." },
  { id: 5, name: "PixelVision 4K", price: 349.99, stock: 12, category: "Electronics", sku: "PV-4K-005", description: "Ultra HD monitor with stunning color accuracy." },
  { id: 6, name: "NanoGuard Antivirus", price: 39.99, stock: 50, category: "Software", sku: "NG-006", description: "Lightweight antivirus protection for all devices." },
  { id: 7, name: "EcoCharge Station", price: 59.99, stock: 8, category: "Accessories", sku: "ECS-007", description: "Multi-device wireless charging station." },
  { id: 8, name: "SwiftRoute Pro", price: 179.99, stock: 3, category: "Electronics", sku: "SRP-008", description: "Professional-grade network router with advanced QoS." },
  { id: 9, name: "UltraSync Watch", price: 249.99, stock: 20, category: "Accessories", sku: "USW-009", description: "Smartwatch with health monitoring and GPS." },
  { id: 10, name: "HyperCool Fan", price: 29.99, stock: 0, category: "Home & Office", sku: "HCF-010", description: "Personal cooling fan with whisper-quiet operation." },
]

export default function EmployeeProductsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "All" || p.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard &gt; Products</p>
        <h1 className="text-2xl font-semibold tracking-tight">Product Catalog</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-lg border p-0.5">
          <AnimateButton
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="size-4" />
          </AnimateButton>
          <AnimateButton
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("list")}
          >
            <List className="size-4" />
          </AnimateButton>
        </div>
      </div>

      {viewMode === "grid" ? (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <Dialog>
                <DialogTrigger nativeButton={false} render={<Card className="cursor-pointer transition-shadow hover:shadow-md" />}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">{product.name}</CardTitle>
                        <CardDescription>{product.category}</CardDescription>
                      </div>
                      <Badge variant={product.stock === 0 ? "outline" : product.stock < 10 ? "secondary" : "default"}>
                        {product.stock === 0 ? "OOS" : product.stock}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3" />
                      Click to view details
                    </div>
                  </CardContent>
                </DialogTrigger>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{product.name}</DialogTitle>
                      <DialogDescription>SKU: {product.sku}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm font-medium">Price</span>
                        <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm font-medium">Stock</span>
                        <Badge variant={product.stock === 0 ? "outline" : product.stock < 10 ? "secondary" : "default"}>
                          {product.stock === 0 ? "Out of Stock" : `${product.stock} units`}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm font-medium">Category</span>
                        <span className="text-sm">{product.category}</span>
                      </div>
                    </div>
                  </DialogContent>
                </motion.div>
              </Dialog>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-lg border">
          <motion.div
            className="divide-y"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <Dialog>
                  <DialogTrigger nativeButton={false} render={
                    <div className="flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50" />
                  }>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={product.stock === 0 ? "outline" : product.stock < 10 ? "secondary" : "default"}>
                        {product.stock} left
                      </Badge>
                      <span className="text-sm font-semibold">${product.price.toFixed(2)}</span>
                    </div>
                  </DialogTrigger>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{product.name}</DialogTitle>
                        <DialogDescription>SKU: {product.sku}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm font-medium">Price</span>
                          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm font-medium">Stock</span>
                          <Badge variant={product.stock === 0 ? "outline" : product.stock < 10 ? "secondary" : "default"}>
                            {product.stock === 0 ? "Out of Stock" : `${product.stock} units`}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm font-medium">Category</span>
                          <span className="text-sm">{product.category}</span>
                        </div>
                      </div>
                    </DialogContent>
                  </motion.div>
                </Dialog>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}

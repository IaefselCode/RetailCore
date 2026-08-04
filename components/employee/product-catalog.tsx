"use client"

import { useState } from "react"
import { Search, Grid3X3, List, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { formatMoney } from "@/lib/money"

export interface EmployeeProductRow {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  categoryName: string | null
  description: string | null
}

export function EmployeeProductCatalog({ products }: { products: EmployeeProductRow[] }) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.categoryName).filter(Boolean) as string[]))]

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchesSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    const matchesCategory = category === "All" || p.categoryName === category
    return matchesSearch && matchesCategory
  })

  function stockBadge(stock: number) {
    if (stock === 0) return { label: "OOS", variant: "outline" as const }
    if (stock < 10) return { label: String(stock), variant: "secondary" as const }
    return { label: String(stock), variant: "default" as const }
  }

  function ProductDialog({ product }: { product: EmployeeProductRow }) {
    const badge = stockBadge(product.stock)
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>SKU: {product.sku}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">Price</span>
            <span className="text-lg font-bold">{formatMoney(product.price)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">Shop Stock</span>
            <Badge variant={badge.variant}>
              {product.stock === 0 ? "Out of Stock" : `${product.stock} units`}
            </Badge>
          </div>
          {product.categoryName && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">Category</span>
              <span className="text-sm">{product.categoryName}</span>
            </div>
          )}
        </div>
      </DialogContent>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard &gt; Products</p>
        <h1 className="text-2xl font-semibold tracking-tight">Product Catalog</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-lg border p-0.5">
          <AnimateButton variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setViewMode("grid")}>
            <Grid3X3 className="size-4" />
          </AnimateButton>
          <AnimateButton variant={viewMode === "list" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setViewMode("list")}>
            <List className="size-4" />
          </AnimateButton>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No products found</p>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => {
            const badge = stockBadge(product.stock)
            return (
              <Dialog key={product.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm">{product.name}</CardTitle>
                          <CardDescription>{product.categoryName ?? "—"}</CardDescription>
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold">{formatMoney(product.price)}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="size-3" /> Click to view details
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <ProductDialog product={product} />
              </Dialog>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {filtered.map((product) => {
            const badge = stockBadge(product.stock)
            return (
              <Dialog key={product.id}>
                <DialogTrigger asChild>
                  <div className="flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={badge.variant}>{product.stock} left</Badge>
                      <span className="text-sm font-semibold">{formatMoney(product.price)}</span>
                    </div>
                  </div>
                </DialogTrigger>
                <ProductDialog product={product} />
              </Dialog>
            )
          })}
        </div>
      )}
    </div>
  )
}

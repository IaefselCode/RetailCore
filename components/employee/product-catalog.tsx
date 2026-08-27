"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Search, Grid3X3, List, Eye, Package, Ban } from "lucide-react"
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
import { useCurrency } from "@/components/providers/currency-provider"
import { cn } from "@/lib/utils"

export interface EmployeeProductRow {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  categoryName: string | null
  description: string | null
  imageUrl: string | null
  isActive: boolean
}

export function EmployeeProductCatalog({ products }: { products: EmployeeProductRow[] }) {
  const t = useTranslations("employeeProducts")
  const currency = useCurrency()
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
    if (stock === 0) return { label: t("oos"), variant: "outline" as const }
    if (stock < 10) return { label: String(stock), variant: "secondary" as const }
    return { label: String(stock), variant: "default" as const }
  }

  function ProductImage({ product, className }: { product: EmployeeProductRow; className?: string }) {
    if (product.imageUrl) {
      return (
        <div className={cn("overflow-hidden bg-muted", className)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
        </div>
      )
    }
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <Package className="size-10 text-muted-foreground/50" />
      </div>
    )
  }

  function ProductDialog({ product }: { product: EmployeeProductRow }) {
    const badge = stockBadge(product.stock)
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>SKU: {product.sku}</DialogDescription>
        {!product.isActive && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            <Ban className="size-4" />
            {t("inactive")} — {t("inactive")}
          </div>
        )}
        </DialogHeader>
        <div className="space-y-3">
          <ProductImage product={product} className="h-48 w-full rounded-lg border" />
          {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">{t("price")}</span>
            <span className="text-lg font-bold">{formatMoney(product.price, currency)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">{t("shopStock")}</span>
            <Badge variant={badge.variant}>
              {product.stock === 0 ? t("outOfStock") : t("units", { count: product.stock })}
            </Badge>
          </div>
          {product.categoryName && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">{t("category")}</span>
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
        <p className="text-sm text-muted-foreground">{t("breadcrumb")}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c === "All" ? t("all") : c}</SelectItem>
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
        <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => {
            const badge = stockBadge(product.stock)
            return (
              <Dialog key={product.id}>
                <DialogTrigger asChild>
                  <Card className={"overflow-hidden transition-shadow " + (product.isActive ? "cursor-pointer hover:shadow-md" : "opacity-60")}>
                    <ProductImage product={product} className="h-40 w-full" />
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
                      <p className="text-lg font-bold">{formatMoney(product.price, currency)}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="size-3" /> {t("clickToView")}
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
                  <div className={"flex items-center justify-between px-4 py-3 transition-colors " + (product.isActive ? "cursor-pointer hover:bg-muted/50" : "opacity-60")}>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {!product.isActive && <Badge variant="destructive" className="text-xs">{t("inactive")}</Badge>}
                      <Badge variant={badge.variant}>{t("stockLeft", { count: product.stock })}</Badge>
                      <span className="text-sm font-semibold">{formatMoney(product.price, currency)}</span>
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

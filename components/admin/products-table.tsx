"use client"

import { useTransition, useState, useEffect, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Search, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { toggleProductActive } from "@/lib/products-actions"
import { formatMoney } from "@/lib/money"

export interface ProductRow {
  id: string
  name: string
  sku: string
  price: number
  cost: number | null
  categoryId: string | null
  categoryName: string | null
  imageUrl: string | null
  isActive: boolean
  totalStock: number
}

interface Category {
  id: string
  name: string
}

export function ProductsTable({
  products,
  categories,
  initialSearch,
  initialCategory,
  initialStatus,
}: {
  products: ProductRow[]
  categories: Category[]
  initialSearch: string
  initialCategory: string
  initialStatus: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("products")
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState(initialSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const current = searchParams.get("search") ?? ""
    if (search === current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) params.set("search", search)
      else params.delete("search")
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, pathname, router, searchParams])

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  function toggle(product: ProductRow) {
    const fd = new FormData()
    fd.append("id", product.id)
    fd.append("active", String(!product.isActive))
    startTransition(async () => {
      const result = await toggleProductActive(fd)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={initialCategory} onValueChange={(v) => v && updateParams("category", v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("colCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={initialStatus} onValueChange={(v) => v && updateParams("status", v)}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder={t("colStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="inactive">{t("inactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colProduct")}</TableHead>
                  <TableHead>{t("colSku")}</TableHead>
                  <TableHead>{t("colCategory")}</TableHead>
                  <TableHead>{t("colPrice")}</TableHead>
                  <TableHead>{t("colStock")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      {t("empty")}
                    </TableCell>
                  </TableRow>
                )}
                {products.map((product) => (
                  <TableRow key={product.id} className="transition-colors hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                    <TableCell>{product.categoryName ?? "—"}</TableCell>
                    <TableCell>{formatMoney(product.price)}</TableCell>
                    <TableCell>{product.totalStock}</TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <AnimateButton size="sm" variant="outline" asChild>
                          <Link href={`/admin/products/${product.id}`}>
                            {t("view")}
                            <ChevronRight className="size-3" />
                          </Link>
                        </AnimateButton>
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => toggle(product)}
                          disabled={pending}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

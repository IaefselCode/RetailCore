"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChevronRight, Trash2, AlertTriangle, Grid3X3, List, Package } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import {
  DataTable,
  createAppColumnHelper,
} from "@/components/shared/data-table"
import { toggleProductActive, deleteProduct, deleteAllProducts } from "@/lib/products-actions"
import { formatMoney } from "@/lib/money"
import { useCurrency } from "@/components/providers/currency-provider"

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
  shops: { id: string; name: string }[]
}

interface Category {
  id: string
  name: string
}

const helper = createAppColumnHelper<ProductRow>()

export function ProductsTable({
  products,
  categories,
  initialSearch,
  initialStatus,
  initialCategoryId,
}: {
  products: ProductRow[]
  categories: Category[]
  initialSearch: string
  initialStatus: string
  initialCategoryId?: string
}) {
  const router = useRouter()
  const t = useTranslations("products")
  const tc = useTranslations("common")
  const currency = useCurrency()
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [pending, startTransition] = useTransition()

  function confirmDelete() {
    if (!deleteTarget) return
    const fd = new FormData()
    fd.append("id", deleteTarget.id)
    startTransition(async () => {
      const result = await deleteProduct(fd)
      if (result.success) {
        toast.success(result.message)
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast.error(result.message)
        setDeleteTarget(null)
      }
    })
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

  function ProductCard({ product }: { product: ProductRow }) {
    return (
      <Card className="flex h-full flex-col overflow-hidden">
        {product.imageUrl ? (
          <div className="h-40 w-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-muted">
            <Package className="size-12 text-muted-foreground/50" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <Link href={`/admin/products/${product.id}`} className="min-w-0">
              <CardTitle className="truncate text-sm hover:underline">{product.name}</CardTitle>
              <CardDescription className="truncate">{product.categoryName ?? "—"}</CardDescription>
            </Link>
            <Badge variant={product.isActive ? "default" : "secondary"} className="shrink-0">
              {product.isActive ? t("active") : t("inactive")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
            <span className="text-lg font-bold">{formatMoney(product.price, currency)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {product.shops.length > 0 &&
              product.shops.map((shop) => (
                <Badge key={shop.id} variant="outline" className="text-xs">
                  {shop.name}
                </Badge>
              ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {t("colStock")}: {product.totalStock}
            </span>
            <div className="flex items-center gap-1">
              <AnimateButton size="icon-sm" variant="ghost" asChild>
                <Link href={`/admin/products/${product.id}`} aria-label={t("view")}>
                  <ChevronRight className="size-4" />
                </Link>
              </AnimateButton>
              <AnimateButton
                size="icon-sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteTarget(product)}
                disabled={pending}
                aria-label={t("deleteConfirmTitle")}
              >
                <Trash2 className="size-4" />
              </AnimateButton>
              <Switch
                checked={product.isActive}
                onCheckedChange={() => toggle(product)}
                disabled={pending}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const columns = helper.columns([
    helper.accessor("name", {
      header: t("colProduct"),
      cell: ({ getValue, row }) => (
        <Link href={`/admin/products/${row.original.id}`} className="font-medium hover:underline">
          {getValue() as string}
        </Link>
      ),
    }),
    helper.accessor("sku", {
      header: t("colSku"),
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">{getValue() as string}</span>
      ),
    }),
    helper.accessor("categoryId", {
      id: "categoryId",
      header: t("colCategory"),
      filterFn: "equalsString",
      cell: ({ row }) => row.original.categoryName ?? "—",
    }),
    helper.accessor("shops", {
      id: "shops",
      header: t("colShops"),
      cell: ({ getValue }) => {
        const shops = getValue() as { id: string; name: string }[]
        if (shops.length === 0) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex max-w-56 flex-wrap gap-1">
            {shops.map((shop) => (
              <Badge key={shop.id} variant="outline" className="text-xs">
                {shop.name}
              </Badge>
            ))}
          </div>
        )
      },
    }),
    helper.accessor("price", {
      header: t("colPrice"),
      cell: ({ getValue }) => formatMoney(getValue() as number, currency),
    }),
    helper.accessor("totalStock", {
      header: t("colStock"),
      cell: ({ getValue }) => getValue() as number,
    }),
    helper.accessor("isActive", {
      id: "status",
      header: t("colStatus"),
      filterFn: "equals",
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? "default" : "secondary"}>
          {getValue() ? t("active") : t("inactive")}
        </Badge>
      ),
    }),
    helper.display({
      id: "actions",
      header: t("colActions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <AnimateButton size="sm" variant="outline" asChild>
            <Link href={`/admin/products/${row.original.id}`}>
              {t("view")}
              <ChevronRight className="size-3" />
            </Link>
          </AnimateButton>
          <AnimateButton
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(row.original)}
            disabled={pending}
            aria-label={t("deleteConfirmTitle")}
          >
            <Trash2 className="size-4" />
          </AnimateButton>
          <Switch
            checked={row.original.isActive}
            onCheckedChange={() => toggle(row.original)}
            disabled={pending}
          />
        </div>
      ),
    }),
  ])

  return (
    <>
    <DataTable
      data={products}
      columns={columns}
      getRowId={(row) => row.id}
      searchable
      searchPlaceholder={t("searchPlaceholder")}
      numbered
      pagination
      toolbar={(table) => (
        <>
          <Select
            value={String((table.getColumn("categoryId")?.getFilterValue() as string) ?? "all")}
            onValueChange={(v) => {
              if (!v) return
              table.getColumn("categoryId")?.setFilterValue(v === "all" ? undefined : v)
            }}
          >
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
          <Select
            value={
              table.getColumn("status")?.getFilterValue() === true
                ? "active"
                : table.getColumn("status")?.getFilterValue() === false
                ? "inactive"
                : "all"
            }
            onValueChange={(v) => {
              if (!v) return
              table
                .getColumn("status")
                ?.setFilterValue(v === "all" ? undefined : v === "active")
            }}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder={t("colStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatus")}</SelectItem>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="inactive">{t("inactive")}</SelectItem>
            </SelectContent>
          </Select>
          <AnimateButton
              variant="destructive"
              size="sm"
              onClick={() => setDeleteAllOpen(true)}
              disabled={pending || products.length === 0}
            >
              <Trash2 className="size-4" />
              Delete All
            </AnimateButton>
          <div className="flex items-center rounded-lg border p-0.5">
            <AnimateButton
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("table")}
              aria-label={t("viewTable")}
              aria-pressed={viewMode === "table"}
            >
              <List className="size-4" />
            </AnimateButton>
            <AnimateButton
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("cards")}
              aria-label={t("viewGrid")}
              aria-pressed={viewMode === "cards"}
            >
              <Grid3X3 className="size-4" />
            </AnimateButton>
          </div>
        </>
      )}
      initialGlobalFilter={initialSearch}
      initialColumnFilters={[
        ...(initialCategoryId && initialCategoryId !== "all"
          ? [{ id: "categoryId", value: initialCategoryId }]
          : []),
        ...(initialStatus === "active"
          ? [{ id: "status", value: true }]
          : initialStatus === "inactive"
          ? [{ id: "status", value: false }]
          : []),
      ]}
      empty={t("empty")}
      className="mt-4"
      viewMode={viewMode}
      renderCard={(product) => <ProductCard product={product} />}
    />

    <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle className="size-8 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteConfirmDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteTarget(null)}>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={confirmDelete}>
            {t("deleteConfirmButton")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Delete all dialog */}
    <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle className="size-8 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete all products?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all {products.length} products, their inventory, and stock history. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await deleteAllProducts()
                setDeleteAllOpen(false)
                if (result.success) {
                  toast.success(result.message)
                  router.refresh()
                } else {
                  toast.error(result.message)
                }
              })
            }}
          >
            Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

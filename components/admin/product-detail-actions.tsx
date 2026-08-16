"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { AnimateButton } from "@/components/ui/animate-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteProduct, updateStockLevels } from "@/lib/products-actions"
import { formatMoney } from "@/lib/money"
import { isLowOrOut } from "@/lib/stock-status"

export interface ProductDetailData {
  id: string
  name: string
  sku: string
  description: string | null
  price: number
  cost: number | null
  categoryName: string | null
  imageUrl: string | null
  isActive: boolean
  totalStock: number
  shopStock: {
    id: string
    shopId: string
    shopName: string
    quantity: number
    minStock: number
    maxStock: number
  }[]
}

export function ProductDetailActions({ product }: { product: ProductDetailData }) {
  const router = useRouter()
  const t = useTranslations("productDetail")
  const tc = useTranslations("common")
  const tn = useTranslations("nav")
  const [pending, startTransition] = useTransition()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { min: string; max: string }>>(() =>
    Object.fromEntries(
      product.shopStock.map((row) => [
        row.id,
        { min: String(row.minStock), max: String(row.maxStock) },
      ])
    )
  )

  const margin =
    product.cost != null && product.price > 0
      ? ((product.price - product.cost) / product.price) * 100
      : null

  function handleSaveLevels(rowId: string) {
    const draft = drafts[rowId]
    const min = Number(draft.min)
    const max = Number(draft.max)
    if (draft.min.trim() === "" || !Number.isInteger(min) || min < 0) {
      toast.error(t("invalidLevels"))
      return
    }
    if (draft.max.trim() === "" || !Number.isInteger(max) || max < 0) {
      toast.error(t("invalidLevels"))
      return
    }

    const fd = new FormData()
    fd.append("inventoryId", rowId)
    fd.append("minStock", String(min))
    fd.append("maxStock", String(max))

    setSavingId(rowId)
    startTransition(async () => {
      const result = await updateStockLevels(fd)
      setSavingId(null)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleDelete() {
    const fd = new FormData()
    fd.append("id", product.id)
    startTransition(async () => {
      const result = await deleteProduct(fd)
      if (result.success) {
        toast.success(result.message)
        router.push("/admin/products")
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        {tc("home")} <span className="mx-1">/</span>
        <Link href="/admin/products" className="hover:text-foreground">{tn("products")}</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <AnimateButton variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </AnimateButton>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AnimateButton variant="outline" asChild>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Edit className="size-4" />
              {t("editProduct")}
            </Link>
          </AnimateButton>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <AnimateButton variant="destructive" disabled={pending}>
                <Trash2 className="size-4" />
                {t("delete")}
              </AnimateButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteDescription", { name: product.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : t("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>{t("pricing")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("price")}</span>
              <span className="font-semibold">{formatMoney(product.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("cost")}</span>
              <span>{product.cost != null ? formatMoney(product.cost) : "—"}</span>
            </div>
            {margin != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("margin")}</span>
                <span className="text-green-600">{margin.toFixed(1)}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("stock")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("total")}</span>
              <span className="font-semibold">{t("units", { count: product.totalStock })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("status")}</span>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? tc("active") : tc("inactive")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("details")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("category")}</span>
              <Badge variant="outline">{product.categoryName ?? t("uncategorized")}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {product.description && (
        <Card>
          <CardHeader><CardTitle>{t("description")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {product.shopStock.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t("stockByShop")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("shop")}</TableHead>
                  <TableHead>{t("stock")}</TableHead>
                  <TableHead className="w-28">{t("minStock")}</TableHead>
                  <TableHead className="w-28">{t("maxStock")}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.shopStock.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.shopName}</TableCell>
                    <TableCell
                      className={
                        isLowOrOut(row.quantity, row.minStock)
                          ? "text-yellow-600 font-medium"
                          : ""
                      }
                    >
                      {t("units", { count: row.quantity })}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={drafts[row.id]?.min ?? "0"}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...prev[row.id], min: e.target.value },
                          }))
                        }
                        className="h-8 w-24 text-right tabular-nums"
                        aria-label={`${t("minStock")} ${row.shopName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={drafts[row.id]?.max ?? "0"}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...prev[row.id], max: e.target.value },
                          }))
                        }
                        className="h-8 w-24 text-right tabular-nums"
                        aria-label={`${t("maxStock")} ${row.shopName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <AnimateButton
                        variant="outline"
                        size="sm"
                        disabled={pending || savingId === row.id}
                        onClick={() => handleSaveLevels(row.id)}
                      >
                        {savingId === row.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Save className="size-3.5" />
                        )}
                        {t("save")}
                      </AnimateButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="px-4 py-3 text-xs text-muted-foreground">{t("stockLevelsHint")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { ArrowLeft, Loader2, Save, Store } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { Checkbox } from "@/components/ui/checkbox"
import { AnimateButton } from "@/components/ui/animate-button"
import { updateProduct } from "@/lib/products-actions"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
}

interface Shop {
  id: string
  name: string
  address: string | null
  city: string | null
}

export interface EditProductData {
  id: string
  name: string
  sku: string
  description: string | null
  price: number
  cost: number | null
  categoryId: string | null
  imageUrl: string | null
}

export function EditProductForm({
  product,
  categories,
  shops,
  assignedShopIds,
}: {
  product: EditProductData
  categories: Category[]
  shops: Shop[]
  assignedShopIds: string[]
}) {
  const router = useRouter()
  const t = useTranslations("editProduct")
  const tp = useTranslations("addProduct")
  const tc = useTranslations("common")
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku,
    description: product.description ?? "",
    price: String(product.price),
    cost: product.cost != null ? String(product.cost) : "",
    categoryId: product.categoryId ?? "",
    newCategory: "",
    imageUrl: product.imageUrl,
    shopIds: assignedShopIds.length > 0 ? assignedShopIds : shops.map((s) => s.id),
  })

  const toggleShop = (shopId: string) =>
    setForm((prev) => ({
      ...prev,
      shopIds: prev.shopIds.includes(shopId)
        ? prev.shopIds.filter((id) => id !== shopId)
        : [...prev.shopIds, shopId],
    }))

  const update = (field: string, value: string | null) =>
    setForm((prev) => ({ ...prev, [field]: value ?? "" }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append("id", product.id)
    fd.append("name", form.name)
    fd.append("sku", form.sku)
    fd.append("description", form.description)
    fd.append("price", form.price)
    fd.append("cost", form.cost)
    fd.append("categoryId", form.categoryId)
    fd.append("newCategory", form.newCategory)
    if (form.imageUrl) fd.append("imageUrl", form.imageUrl)
    for (const shopId of form.shopIds) fd.append("shopIds", shopId)

    startTransition(async () => {
      const result = await updateProduct(fd)
      if (result.success) {
        toast.success(result.message)
        router.push(`/admin/products/${product.id}`)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav className="text-sm text-muted-foreground">
        {tc("home")} <span className="mx-1">/</span>
        <Link href="/admin/products" className="hover:text-foreground">{tp("breadcrumb")}</Link>
        <span className="mx-1">/</span>
        <Link href={`/admin/products/${product.id}`} className="hover:text-foreground">{product.name}</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{t("edit")}</span>
      </nav>

      <div className="flex items-center gap-4">
        <Link href={`/admin/products/${product.id}`}>
          <AnimateButton variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </AnimateButton>
        </Link>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>

      <form onSubmit={submit}>
        <Card>
          <CardHeader><CardTitle>{t("productDetails")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{tp("productName")} *</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" value={form.sku} onChange={(e) => update("sku", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{tp("description")}</Label>
              <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">{tp("price")} *</Label>
                <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">{tp("cost")}</Label>
                <Input id="cost" type="number" min="0" step="0.01" value={form.cost} onChange={(e) => update("cost", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{tp("category")}</Label>
              <Select value={form.categoryId || "none"} onValueChange={(v) => update("categoryId", v === "none" ? "" : v ?? "")}>
                <SelectTrigger><SelectValue placeholder={tp("selectCategory")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("none")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCategory">{tp("newCategory")}</Label>
              <Input id="newCategory" value={form.newCategory} onChange={(e) => update("newCategory", e.target.value)} placeholder={tp("newCategoryPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{tp("productImage")}</Label>
              <ImageUpload value={form.imageUrl} onChange={(url) => update("imageUrl", url)} />
            </div>
            <div className="space-y-2">
              <Label>{t("assignShops")} <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground">{t("assignShopsHint")}</p>
              {shops.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">{tp("noShops")}</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {shops.map((shop) => {
                    const checked = form.shopIds.includes(shop.id)
                    return (
                      <label
                        key={shop.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                          checked && "border-primary/60 bg-primary/5"
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleShop(shop.id)}
                          aria-label={shop.name}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            <Store className="size-3.5 text-muted-foreground" />
                            {shop.name}
                          </p>
                          {shop.city || shop.address ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {[shop.city, shop.address].filter(Boolean).join(", ")}
                            </p>
                          ) : null}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {tp("selectedCount", { count: form.shopIds.length })}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AnimateButton type="button" variant="outline" asChild>
                <Link href={`/admin/products/${product.id}`}>{tc("cancel")}</Link>
              </AnimateButton>
              <AnimateButton type="submit" variant="accent" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {t("saveChanges")}
              </AnimateButton>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

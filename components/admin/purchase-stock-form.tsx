"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Plus, Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { AnimateButton } from "@/components/ui/animate-button"
import { purchaseStock } from "@/lib/inventory-actions"
import { formatMoney } from "@/lib/money"

interface ShopOption {
  id: string
  name: string
}

interface ProductOption {
  id: string
  name: string
  sku: string
  cost: number | null
}

type LineItem = { productId: string; productName: string; quantity: string; unitCost: string }

export function PurchaseStockForm({
  shops,
  products,
}: {
  shops: ShopOption[]
  products: ProductOption[]
}) {
  const router = useRouter()
  const t = useTranslations("purchaseStock")
  const tc = useTranslations("common")
  const tn = useTranslations("nav")
  const [pending, startTransition] = useTransition()
  const [shopId, setShopId] = useState("")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [newProductId, setNewProductId] = useState("")
  const [newQty, setNewQty] = useState("")
  const [newCost, setNewCost] = useState("")

  function addLineItem() {
    if (!newProductId || !newQty) return
    const product = products.find((p) => p.id === newProductId)
    if (!product) return
    setLineItems([
      ...lineItems,
      {
        productId: product.id,
        productName: product.name,
        quantity: newQty,
        unitCost: newCost || (product.cost != null ? String(product.cost) : ""),
      },
    ])
    setNewProductId("")
    setNewQty("")
    setNewCost("")
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const totalCost = lineItems.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0),
    0
  )

  function submit() {
    if (!shopId) {
      toast.error(t("selectShop"))
      return
    }
    if (lineItems.length === 0) {
      toast.error(t("addAtLeastOne"))
      return
    }

    const fd = new FormData()
    fd.append("shopId", shopId)
    fd.append("reference", reference)
    fd.append("notes", notes)
    fd.append(
      "items",
      JSON.stringify(
        lineItems.map((item) => ({
          productId: item.productId,
          quantity: parseInt(item.quantity, 10),
          unitCost: item.unitCost ? parseFloat(item.unitCost) : undefined,
        }))
      )
    )

    startTransition(async () => {
      const result = await purchaseStock(fd)
      if (result.success) {
        toast.success(result.message)
        router.push("/admin/inventory")
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
        <Link href="/admin/inventory" className="hover:text-foreground">{tn("inventory")}</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{t("title")}</span>
      </nav>

      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <Card>
        <CardHeader><CardTitle>{t("orderDetails")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("destinationShop")} *</Label>
            <Select value={shopId} onValueChange={(v) => v && setShopId(v)}>
              <SelectTrigger><SelectValue placeholder={t("selectShop")} /></SelectTrigger>
              <SelectContent>
                {shops.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">{t("reference")}</Label>
            <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("lineItems")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={newProductId} onValueChange={(v) => v && setNewProductId(v)}>
              <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder={t("product")} /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder={t("qty")} type="number" min="1" className="w-24" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
            <Input placeholder={t("unitCost")} type="number" min="0" step="0.01" className="w-32" value={newCost} onChange={(e) => setNewCost(e.target.value)} />
            <AnimateButton type="button" variant="outline" onClick={addLineItem}>
              <Plus className="size-4" /> {tc("add")}
            </AnimateButton>
          </div>

          {lineItems.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("product")}</TableHead>
                    <TableHead>{t("qty")}</TableHead>
                    <TableHead>{t("unitCost")}</TableHead>
                    <TableHead>{t("lineTotal")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatMoney(parseFloat(item.unitCost) || 0)}</TableCell>
                      <TableCell>
                        {formatMoney((parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0))}
                      </TableCell>
                      <TableCell>
                        <AnimateButton type="button" variant="ghost" size="icon-sm" onClick={() => removeLineItem(i)}>
                          <Trash2 className="size-4 text-destructive" />
                        </AnimateButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t("estimatedTotal")}: <span className="font-semibold text-foreground">{formatMoney(totalCost)}</span></p>
            <AnimateButton variant="accent" onClick={submit} disabled={pending}>
              <Save className="size-4" />
              {t("submitPurchase")}
            </AnimateButton>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

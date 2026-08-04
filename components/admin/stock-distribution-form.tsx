"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Send } from "lucide-react"
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
import { distributeStock } from "@/lib/inventory-actions"

interface ShopOption {
  id: string
  name: string
}

interface ProductOption {
  id: string
  name: string
  sku: string
  stockByShop: Record<string, number>
}

export function StockDistributionForm({
  shops,
  products,
}: {
  shops: ShopOption[]
  products: ProductOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [productId, setProductId] = useState("")
  const [fromShopId, setFromShopId] = useState("")
  const [notes, setNotes] = useState("")
  const [distributions, setDistributions] = useState<Record<string, string>>({})

  const product = products.find((p) => p.id === productId)
  const sourceStock = product && fromShopId ? (product.stockByShop[fromShopId] ?? 0) : 0
  const totalOut = Object.values(distributions).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0)

  function submit() {
    if (!productId || !fromShopId) {
      toast.error("Select a product and source shop")
      return
    }

    const distList = Object.entries(distributions)
      .filter(([, qty]) => parseInt(qty, 10) > 0)
      .map(([toShopId, qty]) => ({ toShopId, quantity: parseInt(qty, 10) }))

    if (distList.length === 0) {
      toast.error("Enter quantities for at least one destination shop")
      return
    }

    const fd = new FormData()
    fd.append("productId", productId)
    fd.append("fromShopId", fromShopId)
    fd.append("notes", notes)
    fd.append("distributions", JSON.stringify(distList))

    startTransition(async () => {
      const result = await distributeStock(fd)
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
        Home <span className="mx-1">/</span>
        <Link href="/admin/inventory" className="hover:text-foreground">Inventory</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">Stock Distribution</span>
      </nav>

      <h1 className="text-2xl font-semibold">Stock Distribution</h1>

      <Card>
        <CardHeader><CardTitle>Select Product & Source</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={productId} onValueChange={(v) => { if (v) { setProductId(v); setDistributions({}) } }}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Source Shop *</Label>
            <Select value={fromShopId} onValueChange={(v) => v && setFromShopId(v)}>
              <SelectTrigger><SelectValue placeholder="Transfer from" /></SelectTrigger>
              <SelectContent>
                {shops.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {product && fromShopId && (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Available at source: <span className="font-semibold text-foreground">{sourceStock} units</span>
              {totalOut > 0 && ` · Transferring: ${totalOut}`}
            </p>
          )}
        </CardContent>
      </Card>

      {product && fromShopId && (
        <Card>
          <CardHeader><CardTitle>Distribute to Shops</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shop</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Transfer Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shops
                    .filter((s) => s.id !== fromShopId)
                    .map((shop) => (
                      <TableRow key={shop.id}>
                        <TableCell className="font-medium">{shop.name}</TableCell>
                        <TableCell>{product.stockByShop[shop.id] ?? 0}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={distributions[shop.id] ?? ""}
                            onChange={(e) =>
                              setDistributions((prev) => ({ ...prev, [shop.id]: e.target.value }))
                            }
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <AnimateButton variant="accent" onClick={submit} disabled={pending}>
                <Send className="size-4" />
                Distribute Stock
              </AnimateButton>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

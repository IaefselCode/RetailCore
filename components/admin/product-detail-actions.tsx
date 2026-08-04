"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { deleteProduct } from "@/lib/products-actions"
import { formatMoney } from "@/lib/money"

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
  shopStock: { shopName: string; quantity: number; minStock: number }[]
}

export function ProductDetailActions({ product }: { product: ProductDetailData }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const margin =
    product.cost != null && product.price > 0
      ? ((product.price - product.cost) / product.price) * 100
      : null

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
        Home <span className="mx-1">/</span>
        <Link href="/admin/products" className="hover:text-foreground">Products</Link>
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
              Edit Product
            </Link>
          </AnimateButton>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <AnimateButton variant="destructive" disabled={pending}>
                <Trash2 className="size-4" />
                Delete
              </AnimateButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{product.name}&quot;. Products with sales history cannot be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-semibold">{formatMoney(product.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost</span>
              <span>{product.cost != null ? formatMoney(product.cost) : "—"}</span>
            </div>
            {margin != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin</span>
                <span className="text-green-600">{margin.toFixed(1)}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stock</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{product.totalStock} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <Badge variant="outline">{product.categoryName ?? "Uncategorized"}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {product.description && (
        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {product.shopStock.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Stock by Shop</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {product.shopStock.map((row) => (
                <div key={row.shopName} className="flex justify-between text-sm">
                  <span>{row.shopName}</span>
                  <span className={row.quantity <= row.minStock ? "text-yellow-600 font-medium" : ""}>
                    {row.quantity} units (min: {row.minStock})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

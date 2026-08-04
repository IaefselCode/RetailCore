"use client"

import { useActionState, useCallback, useState, useEffect, useRef } from "react"
import { Search, Plus, Trash2, ShoppingCart, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { AnimateButton } from "@/components/ui/animate-button"
import { recordSale } from "@/lib/sales-actions"
import { formatMoney } from "@/lib/money"
import type { ActionResult } from "@/lib/actions"

export interface PosProduct {
  id: string
  name: string
  price: number
  stock: number
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  maxStock: number
}

const TAX_RATE = 0.18
const initialState: ActionResult | null = null

export function RecordSaleForm({ products, shopName }: { products: PosProduct[]; shopName: string }) {
  const [state, formAction, pending] = useActionState(recordSale, initialState)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [customerName, setCustomerName] = useState("")
  const lastToastRef = useRef<string | null>(null)

  useEffect(() => {
    if (!state?.message) return
    const key = `${state.success}-${state.message}`
    if (lastToastRef.current === key) return
    lastToastRef.current = key
    if (state.success) {
      setCart([])
      setCustomerName("")
      setPaymentMethod("CASH")
      toast.success(state.message)
    } else {
      toast.error(state.message)
    }
  }, [state])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = useCallback((product: PosProduct) => {
    if (product.stock <= 0) {
      toast.error("Product out of stock")
      return
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= existing.maxStock) {
          toast.error("Maximum stock reached")
          return prev
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1, maxStock: product.stock }]
    })
    setSearch("")
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        if (quantity <= 0) return item
        return { ...item, quantity: Math.min(quantity, item.maxStock) }
      }).filter((item) => item.id !== id || quantity > 0)
    )
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  const total = subtotal + tax

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (cart.length === 0) {
      e.preventDefault()
      toast.error("Cart is empty")
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Record New Sale</h1>
        <p className="text-sm text-muted-foreground">{shopName} · Add items and complete the transaction</p>
      </div>

      {state?.success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          <CheckCircle2 className="size-4 shrink-0" />
          {state.message}
        </div>
      )}

      <form action={formAction} onSubmit={handleSubmit}>
        <input type="hidden" name="items" value={JSON.stringify(cart.map((c) => ({ productId: c.id, quantity: c.quantity })))} />
        <input type="hidden" name="paymentMethod" value={paymentMethod} />
        <input type="hidden" name="customerName" value={customerName} />
        <input type="hidden" name="discount" value="0" />

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Find Products</CardTitle>
                <CardDescription>Search and add products to the sale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {filteredProducts.map((product) => {
                    const inCart = cart.find((item) => item.id === product.id)
                    return (
                      <div
                        key={product.id}
                        className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                        onClick={() => addToCart(product)}
                      >
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatMoney(product.price)} · {product.stock} in stock
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {inCart && <Badge variant="secondary">{inCart.quantity} in cart</Badge>}
                          <Button variant="ghost" size="icon-sm" type="button">
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  {filteredProducts.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">No products found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sale Items</CardTitle>
                <CardDescription>{cart.length} item{cart.length !== 1 ? "s" : ""} in cart</CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ShoppingCart className="mb-2 size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Cart is empty</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button type="button" variant="outline" size="icon-xs" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                                <span className="w-6 text-center text-sm">{item.quantity}</span>
                                <Button type="button" variant="outline" size="icon-xs" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                              </div>
                            </TableCell>
                            <TableCell>{formatMoney(item.price)}</TableCell>
                            <TableCell>{formatMoney(item.price * item.quantity)}</TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeFromCart(item.id)}>
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Customer Name (optional)</label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in customer" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tax (18%)</span>
                  <span className="text-sm font-medium">{formatMoney(tax)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-bold">{formatMoney(total)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="w-full space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Credit Card</SelectItem>
                      <SelectItem value="MOBILE">Mobile Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <AnimateButton type="submit" className="w-full" size="lg" variant="accent" disabled={pending || cart.length === 0}>
                  {pending ? "Processing..." : "Complete Sale"}
                </AnimateButton>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

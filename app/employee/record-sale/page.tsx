"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Plus, Trash2, ShoppingCart } from "lucide-react"
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

const availableProducts = [
  { id: 1, name: "SonicFlow X1", price: 89.99 },
  { id: 2, name: "PowerCharge Pro", price: 49.99 },
  { id: 3, name: "DataSync Hub", price: 129.99 },
  { id: 4, name: "CloudMesh Gateway", price: 199.99 },
  { id: 5, name: "PixelVision 4K", price: 349.99 },
  { id: 6, name: "NanoGuard Antivirus", price: 39.99 },
  { id: 7, name: "EcoCharge Station", price: 59.99 },
  { id: 8, name: "SwiftRoute Pro", price: 179.99 },
  { id: 9, name: "UltraSync Watch", price: 249.99 },
  { id: 10, name: "HyperCool Fan", price: 29.99 },
]

const TAX_RATE = 0.1

export default function RecordSalePage() {
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState("cash")

  const filteredProducts = availableProducts.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = useCallback((product: (typeof availableProducts)[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setSearch("")
  }, [])

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }, [removeFromCart])

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax

  const completeSale = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }
    toast.success(`Sale completed! Total: $${total.toFixed(2)} via ${paymentMethod}`)
    setCart([])
    setPaymentMethod("cash")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Record New Sale</h1>
        <p className="text-sm text-muted-foreground">Add items and complete the transaction</p>
      </div>

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
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <motion.div
                className="max-h-64 space-y-1 overflow-y-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={search}
              >
                {filteredProducts.map((product) => {
                  const inCart = cart.find((item) => item.id === product.id)
                  return (
                    <motion.div
                      key={product.id}
                      variants={itemVariants}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {inCart && (
                          <Badge variant="secondary">{inCart.quantity} in cart</Badge>
                        )}
                        <Button variant="ghost" size="icon-sm" type="button">
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No products found</p>
                )}
              </motion.div>
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
                  <p className="text-xs text-muted-foreground">Search and add products from the left</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <div className="overflow-x-auto">
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
                        <AnimatePresence>
                          {cart.map((item) => (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.2 }}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon-xs"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon-xs"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>${item.price.toFixed(2)}</TableCell>
                              <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tax (10%)</span>
                <span className="text-sm font-medium">${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-xl font-bold">${total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <div className="w-full space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit-card">Credit Card</SelectItem>
                    <SelectItem value="mobile-payment">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <AnimateButton className="w-full" size="lg" variant="accent" onClick={completeSale}>
                Complete Sale
              </AnimateButton>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

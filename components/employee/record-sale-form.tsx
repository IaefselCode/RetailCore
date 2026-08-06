"use client"

import { useActionState, useCallback, useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
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
  createAppColumnHelper,
  useAppTable,
} from "@/components/shared/data-table"
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

const cartHelper = createAppColumnHelper<CartItem>()

function RecordSaleFormBody({
  products,
  shopName,
  formAction,
  pending,
  successMessage,
}: {
  products: PosProduct[]
  shopName: string
  formAction: (payload: FormData) => void
  pending: boolean
  successMessage: string | null
}) {
  const t = useTranslations("recordSale")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [customerName, setCustomerName] = useState("")

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = useCallback((product: PosProduct) => {
    if (product.stock <= 0) {
      toast.error(t("productOutOfStock"))
      return
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= existing.maxStock) {
          toast.error(t("maxStockReached"))
          return prev
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1, maxStock: product.stock }]
    })
    setSearch("")
  }, [t])

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item
          if (quantity <= 0) return item
          return { ...item, quantity: Math.min(quantity, item.maxStock) }
        })
        .filter((item) => item.id !== id || quantity > 0)
    )
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  const total = subtotal + tax

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (cart.length === 0) {
      e.preventDefault()
      toast.error(t("cartIsEmpty"))
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle", { shop: shopName })}</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          <CheckCircle2 className="size-4 shrink-0" />
          {successMessage}
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
                <CardTitle>{t("findProducts")}</CardTitle>
                <CardDescription>{t("findProductsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={t("searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
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
                            {formatMoney(product.price)} · {t("inStock", { count: product.stock })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {inCart && <Badge variant="secondary">{t("inCart", { count: inCart.quantity })}</Badge>}
                          <Button variant="ghost" size="icon-sm" type="button">
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  {filteredProducts.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">{t("noProductsFound")}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("saleItems")}</CardTitle>
                <CardDescription>{t("itemsInCart", { count: cart.length })}</CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ShoppingCart className="mb-2 size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t("cartIsEmpty")}</p>
                  </div>
                ) : (
                  <CartTable
                    cart={cart}
                    t={t}
                    onQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{t("orderSummary")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("customerName")}</label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t("walkInCustomer")} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("subtotal")}</span>
                  <span className="text-sm font-medium">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("tax")}</span>
                  <span className="text-sm font-medium">{formatMoney(tax)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">{t("total")}</span>
                  <span className="text-xl font-bold">{formatMoney(total)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="w-full space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("paymentMethod")}</label>
                  <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">{t("cash")}</SelectItem>
                      <SelectItem value="CARD">{t("creditCard")}</SelectItem>
                      <SelectItem value="MOBILE">{t("mobilePayment")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <AnimateButton type="submit" className="w-full" size="lg" variant="accent" disabled={pending || cart.length === 0}>
                  {pending ? t("processing") : t("completeSale")}
                </AnimateButton>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

function CartTable({
  cart,
  t,
  onQuantity,
  onRemove,
}: {
  cart: CartItem[]
  t: (key: string, values?: Record<string, string | number>) => string
  onQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}) {
  const table = useAppTable({
    data: cart,
    columns: cartHelper.columns([
      cartHelper.accessor("name", {
        header: t("colProduct"),
        cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
      }),
      cartHelper.accessor("quantity", {
        header: t("colQty"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => onQuantity(row.original.id, row.original.quantity - 1)}
            >
              -
            </Button>
            <span className="w-6 text-center text-sm">{row.original.quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => onQuantity(row.original.id, row.original.quantity + 1)}
            >
              +
            </Button>
          </div>
        ),
      }),
      cartHelper.accessor("price", {
        header: t("colPrice"),
        cell: ({ getValue }) => formatMoney(getValue() as number),
      }),
      cartHelper.display({
        id: "subtotal",
        header: t("colSubtotal"),
        cell: ({ row }) => formatMoney(row.original.price * row.original.quantity),
      }),
      cartHelper.display({
        id: "remove",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(row.original.id)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        ),
      }),
    ]),
    getRowId: (row) => row.id,
  })

  const rows = table.getRowModel().rows

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function RecordSaleForm({ products, shopName }: { products: PosProduct[]; shopName: string }) {
  const [state, formAction, pending] = useActionState(recordSale, initialState)
  const lastToastRef = useRef<string | null>(null)
  const resetKey = state?.success ? state.message : "idle"

  useEffect(() => {
    if (!state?.message) return
    const key = `${state.success}-${state.message}`
    if (lastToastRef.current === key) return
    lastToastRef.current = key
    if (state.success) toast.success(state.message)
    else toast.error(state.message)
  }, [state])

  return (
    <RecordSaleFormBody
      key={resetKey}
      products={products}
      shopName={shopName}
      formAction={formAction}
      pending={pending}
      successMessage={state?.success ? state.message : null}
    />
  )
}

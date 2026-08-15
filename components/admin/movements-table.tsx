"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowDownToLine, ArrowUpFromLine, ChevronLeft, ChevronRight, History, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AnimateButton } from "@/components/ui/animate-button"
import { cn } from "@/lib/utils"

export interface MovementRow {
  id: string
  productName: string
  sku: string
  shopName: string
  type: string
  quantity: number
  reference: string | null
  notes: string | null
  createdAt: string
}

interface ShopOption {
  id: string
  name: string
}

/** Movement type -> translation key. Legacy types (PURCHASE/TRANSFER) kept for
 * rows created before the STOCK_IN / TRANSFER_IN / TRANSFER_OUT naming. */
const TYPE_KEYS: Record<string, string> = {
  STOCK_IN: "typeStockIn",
  SALE: "typeSale",
  SALE_REVERSAL: "typeSaleReversal",
  TRANSFER_IN: "typeTransferIn",
  TRANSFER_OUT: "typeTransferOut",
  PURCHASE: "typePurchase",
  TRANSFER: "typeTransfer",
}

export function MovementsTable({
  rows,
  shops,
  total,
  unitsIn,
  unitsOut,
  netQuantity,
  initialFilters,
  pageSize,
  labels,
}: {
  rows: MovementRow[]
  shops: ShopOption[]
  total: number
  unitsIn: number
  unitsOut: number
  netQuantity: number
  initialFilters: {
    product: string
    shopId: string
    type: string
    dateFrom: string
    dateTo: string
    page: number
  }
  pageSize: number
  labels: { home: string; title: string; breadcrumb: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("inventory")
  const tc = useTranslations("common")
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== "all") params.set(key, value)
      else params.delete(key)
    }
    if (!updates.page) params.delete("page")
    // Mark the navigation as a transition so the search field can show a
    // pending spinner while the server re-filters the (possibly large) table.
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        {labels.home} <span className="mx-1">/</span>
        <span className="text-foreground">{labels.breadcrumb}</span>
      </nav>

      <div className="flex items-center gap-2">
        <History className="size-5" />
        <h1 className="text-2xl font-semibold">{labels.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <ArrowDownToLine className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("unitsIn")}</p>
              <p className="text-xl font-bold">{unitsIn.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <ArrowUpFromLine className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("unitsOut")}</p>
              <p className="text-xl font-bold">{unitsOut.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <History className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("netChange")}</p>
              <p className={cn("text-xl font-bold", netQuantity < 0 ? "text-destructive" : "")}>
                {netQuantity > 0 ? "+" : ""}{netQuantity.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 pt-6">
          <div className="relative w-full sm:w-48">
            <Input
              defaultValue={initialFilters.product}
              placeholder={t("filterProduct")}
              className="pr-8"
              onChange={(e) => updateParams({ product: e.target.value, page: "1" })}
              aria-busy={isPending}
            />
            {isPending && (
              <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          <Input
            type="date"
            defaultValue={initialFilters.dateFrom}
            className="w-full sm:w-40"
            onChange={(e) => updateParams({ dateFrom: e.target.value, page: "1" })}
          />
          <Input
            type="date"
            defaultValue={initialFilters.dateTo}
            className="w-full sm:w-40"
            onChange={(e) => updateParams({ dateTo: e.target.value, page: "1" })}
          />
          <Select
            defaultValue={initialFilters.shopId}
            onValueChange={(v) => v && updateParams({ shopId: v, page: "1" })}
          >
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={t("filterShop")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allShops")}</SelectItem>
              {shops.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            defaultValue={initialFilters.type}
            onValueChange={(v) => v && updateParams({ type: v, page: "1" })}
          >
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={t("filterType")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTypes")}</SelectItem>
              {Object.entries(TYPE_KEYS).map(([value, labelKey]) => (
                <SelectItem key={value} value={value}>{t(labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">{tc("no")}</TableHead>
                <TableHead>{t("colDate")}</TableHead>
                <TableHead>{t("colProduct")}</TableHead>
                <TableHead>{t("colSku")}</TableHead>
                <TableHead>{t("colShop")}</TableHead>
                <TableHead>{t("colType")}</TableHead>
                <TableHead className="text-right">{t("colQuantity")}</TableHead>
                <TableHead>{t("colReference")}</TableHead>
                <TableHead>{t("colNotes")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    {t("emptyMovements")}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, index) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                  <TableCell className="text-muted-foreground tabular-nums">
                    {(initialFilters.page - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{row.productName}</TableCell>
                  <TableCell className="text-muted-foreground">{row.sku}</TableCell>
                  <TableCell>{row.shopName}</TableCell>
                  <TableCell>
                    <Badge variant={row.quantity >= 0 ? "default" : "destructive"}>
                      {t(TYPE_KEYS[row.type] ?? row.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn("font-semibold", row.quantity < 0 ? "text-destructive" : "")}>
                      {row.quantity > 0 ? "+" : ""}{row.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{row.reference ?? "—"}</TableCell>
                  <TableCell className="max-w-40 truncate text-muted-foreground">{row.notes ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("pageInfo", { page: initialFilters.page, pages: totalPages, total })}
        </p>
        <div className="flex gap-2">
          <AnimateButton
            variant="outline"
            size="sm"
            disabled={initialFilters.page <= 1}
            onClick={() => updateParams({ page: String(initialFilters.page - 1) })}
          >
            <ChevronLeft className="size-4" /> {t("prev")}
          </AnimateButton>
          <AnimateButton
            variant="outline"
            size="sm"
            disabled={initialFilters.page >= totalPages}
            onClick={() => updateParams({ page: String(initialFilters.page + 1) })}
          >
            {t("next")} <ChevronRight className="size-4" />
          </AnimateButton>
        </div>
      </div>
    </div>
  )
}

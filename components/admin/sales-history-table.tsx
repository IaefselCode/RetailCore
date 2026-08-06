"use client"

import { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Download, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AnimateButton } from "@/components/ui/animate-button"
import { refundSale, getCsvExport } from "@/lib/sales-actions"
import { formatMoney } from "@/lib/money"

export interface SalesHistoryRow {
  id: string
  invoiceNo: string
  customerName: string | null
  shopName: string
  itemCount: number
  total: number
  paymentMethod: string | null
  createdAt: string
  status: string
}

interface ShopOption {
  id: string
  name: string
}

const statusBadge: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  REFUNDED: "destructive",
  CANCELLED: "destructive",
}

const PAGE_SIZE = 10

export function SalesHistoryTable({
  sales,
  shops,
  total,
  initialFilters,
}: {
  sales: SalesHistoryRow[]
  shops: ShopOption[]
  total: number
  initialFilters: {
    dateFrom: string
    dateTo: string
    paymentMethod: string
    status: string
    shopId: string
    page: number
  }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("salesHistory")
  const tc = useTranslations("common")
  const [pending, startTransition] = useTransition()

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== "all") params.set(key, value)
      else params.delete(key)
    }
    if (!updates.page) params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  function refund(saleId: string) {
    const fd = new FormData()
    fd.append("saleId", saleId)
    startTransition(async () => {
      const result = await refundSale(fd)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  async function exportCsv() {
    const csv = await getCsvExport({
      dateFrom: initialFilters.dateFrom || undefined,
      dateTo: initialFilters.dateTo || undefined,
      paymentMethod: initialFilters.paymentMethod,
      status: initialFilters.status,
      shopId: initialFilters.shopId,
    })
    if (!csv) {
      toast.error(t("exportFailed"))
      return
    }
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t("csvExported"))
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        {tc("home")} <span className="mx-1">/</span>
        <Link href="/admin/sales" className="hover:text-foreground">{t("breadcrumb")}</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{t("history")}</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <AnimateButton variant="outline" onClick={exportCsv}>
          <Download className="size-4" />
          {t("exportCsv")}
        </AnimateButton>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 pt-6">
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
            defaultValue={initialFilters.paymentMethod}
            onValueChange={(v) => v && updateParams({ paymentMethod: v, page: "1" })}
          >
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={t("payment")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allPayments")}</SelectItem>
              <SelectItem value="CASH">{t("cash")}</SelectItem>
              <SelectItem value="CARD">{t("card")}</SelectItem>
              <SelectItem value="MOBILE">{t("mobile")}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            defaultValue={initialFilters.status}
            onValueChange={(v) => v && updateParams({ status: v, page: "1" })}
          >
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder={t("status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatus")}</SelectItem>
              <SelectItem value="COMPLETED">{t("completed")}</SelectItem>
              <SelectItem value="REFUNDED">{t("refunded")}</SelectItem>
              <SelectItem value="PENDING">{t("pending")}</SelectItem>
              <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            defaultValue={initialFilters.shopId}
            onValueChange={(v) => v && updateParams({ shopId: v, page: "1" })}
          >
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={t("shop")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allShops")}</SelectItem>
              {shops.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>              <TableHeader>
                <TableRow>
                  <TableHead>{t("colInvoice")}</TableHead>
                  <TableHead>{t("colCustomer")}</TableHead>
                  <TableHead>{t("colShop")}</TableHead>
                  <TableHead>{t("colItems")}</TableHead>
                  <TableHead>{t("colAmount")}</TableHead>
                  <TableHead>{t("colPayment")}</TableHead>
                  <TableHead>{t("colDate")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                      {t("empty")}
                    </TableCell>
                  </TableRow>
                )}
              {sales.map((sale) => (
                <TableRow key={sale.id} className="transition-colors hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{sale.invoiceNo}</TableCell>
                  <TableCell>{sale.customerName ?? "—"}</TableCell>
                  <TableCell>{sale.shopName}</TableCell>
                  <TableCell>{sale.itemCount}</TableCell>
                  <TableCell className="font-medium">{formatMoney(sale.total)}</TableCell>
                  <TableCell>{sale.paymentMethod ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[sale.status] ?? "default"}>{sale.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {sale.status === "COMPLETED" && (
                      <AnimateButton size="sm" variant="outline" disabled={pending} onClick={() => refund(sale.id)}>
                        {t("refund")}
                      </AnimateButton>
                    )}
                  </TableCell>
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

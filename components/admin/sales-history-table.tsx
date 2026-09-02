"use client"

import { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AnimateButton } from "@/components/ui/animate-button"
import {
  createAppColumnHelper,
  useAppTable,
} from "@/components/shared/data-table"
import { refundSale, getCsvExport } from "@/lib/sales-actions"
import { formatMoney } from "@/lib/money"
import { useCurrency } from "@/components/providers/currency-provider"
import { useFormattedDate } from "@/components/providers/date-format-provider"

export interface SalesHistoryRow {
  id: string
  invoiceNo: string
  customerName: string | null
  employeeName: string | null
  shopName: string
  itemCount: number
  total: number
  discount: number
  paymentMethod: string | null
  createdAt: string
  status: string
}

interface ShopOption {
  id: string
  name: string
}

const helper = createAppColumnHelper<SalesHistoryRow>()

const statusBadge: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  VOIDED: "destructive",
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
  const currency = useCurrency()
  const fmtDate = useFormattedDate()
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

  const locale = useLocale()

  async function exportCsv() {
    if (total === 0) {
      toast.info(tc("noData") || "No sales data to export")
      return
    }
    const base64 = await getCsvExport({
      dateFrom: initialFilters.dateFrom || undefined,
      dateTo: initialFilters.dateTo || undefined,
      paymentMethod: initialFilters.paymentMethod,
      status: initialFilters.status,
      shopId: initialFilters.shopId,
      locale,
    })
    if (!base64) {
      toast.error(t("exportFailed"))
      return
    }
    // Decode base64 to binary
    const binaryStr = atob(base64)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-export-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t("csvExported"))
  }

  const table = useAppTable({
    data: sales,
    columns: helper.columns([
      helper.display({
        id: "no",
        header: tc("no"),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {(initialFilters.page - 1) * PAGE_SIZE + row.index + 1}
          </span>
        ),
      }),
      helper.accessor("invoiceNo", {
        header: t("colInvoice"),
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
      }),
      helper.accessor("customerName", {
        header: t("colCustomer"),
        cell: ({ getValue }) => (getValue() as string | null) ?? "—",
      }),
      helper.accessor("employeeName", {
        header: t("colEmployee"),
        cell: ({ getValue }) => (getValue() as string | null) ?? "—",
      }),
      helper.accessor("shopName", { header: t("colShop"), cell: ({ getValue }) => getValue() as string }),
      helper.accessor("itemCount", { header: t("colItems"), cell: ({ getValue }) => getValue() as number }),
      helper.accessor("total", {
        header: t("colAmount"),
        cell: ({ getValue }) => <span className="font-medium">{formatMoney(getValue() as number, currency)}</span>,
      }),
      helper.accessor("discount", {
        header: t("colDiscount"),
        cell: ({ getValue }) => {
          const d = getValue() as number
          return d > 0 ? (
            <span className="text-green-600 font-medium">-{formatMoney(d, currency)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      }),
      helper.accessor("paymentMethod", {
        header: t("colPayment"),
        cell: ({ getValue }) => (getValue() as string | null) ?? "—",
      }),
      helper.accessor("createdAt", {
        header: t("colDate"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{fmtDate(getValue() as string)}</span>
        ),
      }),
      helper.accessor("status", {
        header: t("colStatus"),
        cell: ({ getValue }) => (
          <Badge variant={statusBadge[getValue() as string] ?? "default"}>
            {getValue() as string}
          </Badge>
        ),
      }),
      helper.display({
        id: "actions",
        header: t("colActions"),
        cell: ({ row }) =>
          row.original.status === "COMPLETED" ? (
            <AnimateButton size="sm" variant="outline" disabled={pending} onClick={() => refund(row.original.id)}>
              {t("refund")}
            </AnimateButton>
          ) : null,
      }),
    ]),
    getRowId: (row) => row.id,
    manualPagination: true,
    rowCount: total,
    initialState: {
      pagination: { pageIndex: initialFilters.page - 1, pageSize: PAGE_SIZE },
    },
  })

  const rows = table.getRowModel().rows

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
        <AnimateButton variant="outline" onClick={exportCsv} disabled={total === 0}>
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
              <SelectItem value="VOIDED">{t("voided")}</SelectItem>
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
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
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

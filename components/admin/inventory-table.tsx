"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, createAppColumnHelper } from "@/components/shared/data-table"

export interface InventoryRow {
  id: string
  productName: string
  sku: string
  shopName: string
  quantity: number
  minStock: number
  maxStock: number
  statusKey: string
}

interface Shop {
  id: string
  name: string
}

const helper = createAppColumnHelper<InventoryRow>()

export function InventoryTable({
  rows,
  shops,
}: {
  rows: InventoryRow[]
  shops: Shop[]
}) {
  const t = useTranslations("inventory")

  const columns = helper.columns([
    helper.accessor("productName", {
      header: t("colProduct"),
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    }),
    helper.accessor("sku", {
      header: t("colSku"),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue() as string}</span>
      ),
    }),
    helper.accessor("shopName", {
      header: t("colShop"),
      filterFn: "equalsString",
      cell: ({ getValue }) => getValue() as string,
    }),
    helper.accessor("quantity", {
      header: t("colQuantity"),
      cell: ({ getValue }) => <span className="font-semibold">{getValue() as number}</span>,
    }),
    helper.accessor("minStock", {
      header: t("colMinStock"),
      cell: ({ getValue }) => getValue() as number,
    }),
    helper.accessor("statusKey", {
      header: t("colStatus"),
      filterFn: "equalsString",
      cell: ({ row }) => {
        const key = row.original.statusKey
        return (
          <Badge variant={statusVariant(key)} className={key === "statusOver" ? "text-blue-600" : undefined}>
            {t(key)}
          </Badge>
        )
      },
    }),
  ])

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      searchable
      searchPlaceholder={t("filterSearch")}
      numbered
      pagination
      empty={t("empty")}
      toolbar={(table) => (
        <>
          <Select
            value={String((table.getColumn("shopName")?.getFilterValue() as string) ?? "all")}
            onValueChange={(v) => {
              if (!v) return
              table.getColumn("shopName")?.setFilterValue(v === "all" ? undefined : v)
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t("colShop")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allShops")}</SelectItem>
              {shops.map((s) => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String((table.getColumn("statusKey")?.getFilterValue() as string) ?? "all")}
            onValueChange={(v) => {
              if (!v) return
              table.getColumn("statusKey")?.setFilterValue(v === "all" ? undefined : v)
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder={t("colStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatus")}</SelectItem>
              <SelectItem value="statusIn">{t("statusIn")}</SelectItem>
              <SelectItem value="statusLow">{t("statusLow")}</SelectItem>
              <SelectItem value="statusOut">{t("statusOut")}</SelectItem>
              <SelectItem value="statusOver">{t("statusOver")}</SelectItem>
            </SelectContent>
          </Select>
        </>
      )}
    />
  )
}

function statusVariant(
  key: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (key) {
    case "statusOut":
      return "destructive"
    case "statusLow":
      return "secondary"
    case "statusOver":
      return "outline"
    default:
      return "default"
  }
}

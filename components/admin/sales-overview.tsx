"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { DollarSign, Wallet, TrendingUp, Boxes, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

export interface SalesPeriodData {
  key: "today" | "week" | "month" | "year"
  revenue: number
  cost: number
  profit: number
  units: number
  transactions: number
}

const PERIOD_KEYS: { value: SalesPeriodData["key"]; labelKey: string }[] = [
  { value: "today", labelKey: "tabToday" },
  { value: "week", labelKey: "tabWeek" },
  { value: "month", labelKey: "tabMonth" },
  { value: "year", labelKey: "tabYear" },
]

export function SalesOverview({ data }: { data: SalesPeriodData[] }) {
  const t = useTranslations("sales")
  const [activeKey, setActiveKey] = useState<SalesPeriodData["key"]>("today")

  const active = data.find((d) => d.key === activeKey) ?? data[0]

  const metrics = [
    { labelKey: "metricRevenue", value: formatMoney(active.revenue), icon: DollarSign },
    { labelKey: "metricCost", value: formatMoney(active.cost), icon: Wallet },
    { labelKey: "metricProfit", value: formatMoney(active.profit), icon: TrendingUp },
    { labelKey: "metricUnits", value: active.units.toLocaleString(), icon: Boxes },
    { labelKey: "metricTransactions", value: active.transactions.toLocaleString(), icon: ShoppingCart },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{t("overviewTitle")}</CardTitle>
          <CardDescription>{t("overviewDesc")}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-1 rounded-md border p-0.5">
          {PERIOD_KEYS.map((period) => (
            <AnimateButton
              key={period.value}
              size="sm"
              variant="ghost"
              onClick={() => setActiveKey(period.value)}
              aria-pressed={activeKey === period.value}
              className={cn(activeKey === period.value && "bg-accent text-accent-foreground")}
            >
              {t(period.labelKey)}
            </AnimateButton>
          ))}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.labelKey} className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <metric.icon className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{t(metric.labelKey)}</p>
              <p className="truncate text-lg font-bold">{metric.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

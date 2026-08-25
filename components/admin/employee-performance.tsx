"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  BarChart3,
  Target,
  CreditCard,
  Wallet,
  Minus,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface PeriodStats {
  revenue: number
  profit: number
  cost: number
  totalDiscount: number
  salesCount: number
  completedCount: number
  cancelledCount: number
  voidedCount: number
  itemsSold: number
  avgOrderValue: number
  avgItemsPerSale: number
  paymentMethods: Record<string, number>
  prevRevenue: number
  prevProfit: number
  prevSalesCount: number
}

export interface EmployeePerformanceProps {
  today: PeriodStats
  week: PeriodStats
  month: PeriodStats
  year: PeriodStats
  allTime: PeriodStats
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <Minus className="size-3.5 text-muted-foreground" />
  if (previous === 0) return <TrendingUp className="size-3.5 text-green-500" />
  const change = ((current - previous) / previous) * 100
  if (change > 0) return <TrendingUp className="size-3.5 text-green-500" />
  if (change < 0) return <TrendingDown className="size-3.5 text-red-500" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null
  if (previous === 0 && current > 0) return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">New</Badge>
  const change = ((current - previous) / previous) * 100
  if (change === 0) return null
  const positive = change > 0
  return (
    <Badge
      variant="default"
      className={cn(
        "border text-xs font-normal",
        positive
          ? "bg-green-500/10 text-green-600 border-green-500/20"
          : "bg-red-500/10 text-red-600 border-red-500/20"
      )}
    >
      {positive ? "+" : ""}{change.toFixed(1)}%
    </Badge>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  trend,
  subtitle,
}: {
  title: string
  value: string
  icon: React.ElementType
  iconColor?: string
  trend?: { current: number; previous: number }
  subtitle?: string
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("size-4", iconColor ?? "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && <TrendBadge current={trend.current} previous={trend.previous} />}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

function PaymentBreakdown({ methods }: { methods: Record<string, number> }) {
  const t = useTranslations("employeeDetail")
  const entries = Object.entries(methods).filter(([, count]) => count > 0)
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">{t("noSales")}</p>

  const total = entries.reduce((sum, [, count]) => sum + count, 0)
  const labels: Record<string, string> = {
    cash: "Cash",
    card: "Card",
    mobile: "Mobile",
    bank_transfer: "Bank Transfer",
    credit: "Credit",
  }

  return (
    <div className="space-y-2">
      {entries
        .sort((a, b) => b[1] - a[1])
        .map(([method, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={method} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {method === "cash" ? (
                    <Wallet className="size-3.5 text-muted-foreground" />
                  ) : method === "card" ? (
                    <CreditCard className="size-3.5 text-muted-foreground" />
                  ) : (
                    <DollarSign className="size-3.5 text-muted-foreground" />
                  )}
                  {labels[method] ?? method}
                </span>
                <span className="text-muted-foreground">
                  {count} ({pct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
    </div>
  )
}

function PeriodStatsView({ stats }: { stats: PeriodStats }) {
  const t = useTranslations("employeeDetail")
  const tc = useTranslations("common")
  const formatMoney = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title={t("revenue")}
          value={formatMoney(stats.revenue)}
          icon={DollarSign}
          iconColor="text-green-500"
          trend={{ current: stats.revenue, previous: stats.prevRevenue }}
        />
        <StatCard
          title={t("profit")}
          value={formatMoney(stats.profit)}
          icon={TrendingUp}
          iconColor="text-emerald-500"
          trend={{ current: stats.profit, previous: stats.prevProfit }}
          subtitle={stats.revenue > 0 ? `${((stats.profit / stats.revenue) * 100).toFixed(1)}% margin` : undefined}
        />
        <StatCard
          title={t("totalSales")}
          value={String(stats.salesCount)}
          icon={ShoppingCart}
          iconColor="text-blue-500"
          trend={{ current: stats.salesCount, previous: stats.prevSalesCount }}
        />
        <StatCard
          title={t("itemsSold")}
          value={String(stats.itemsSold)}
          icon={Package}
          iconColor="text-violet-500"
          subtitle={stats.salesCount > 0 ? `~${stats.avgItemsPerSale.toFixed(1)} per sale` : undefined}
        />
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title={t("avgOrderValue")}
          value={formatMoney(stats.avgOrderValue)}
          icon={Target}
          iconColor="text-amber-500"
        />
        <StatCard
          title={t("completed")}
          value={String(stats.completedCount)}
          icon={TrendingUp}
          iconColor="text-green-500"
          subtitle={
            stats.salesCount > 0
              ? `${((stats.completedCount / stats.salesCount) * 100).toFixed(0)}% completion`
              : undefined
          }
        />
        <StatCard
          title={t("cancelled")}
          value={String(stats.cancelledCount + stats.voidedCount)}
          icon={TrendingDown}
          iconColor="text-red-500"
          subtitle={
            stats.salesCount > 0
              ? `${((stats.cancelledCount / stats.salesCount) * 100).toFixed(0)}% cancel rate`
              : undefined
          }
        />
      <StatCard
        title={t("cost")}
        value={formatMoney(stats.cost)}
        icon={BarChart3}
        iconColor="text-orange-500"
        subtitle={stats.revenue > 0 ? `${((stats.cost / stats.revenue) * 100).toFixed(1)}% of revenue` : undefined}
      />
      {stats.totalDiscount > 0 && (
        <StatCard
          title={t("discountsGiven")}
          value={formatMoney(stats.totalDiscount)}
          icon={TrendingDown}
          iconColor="text-amber-500"
          subtitle={stats.revenue > 0 ? `${((stats.totalDiscount / (stats.revenue + stats.totalDiscount)) * 100).toFixed(1)}% off list` : undefined}
        />
      )}
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("paymentMethods")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentBreakdown methods={stats.paymentMethods} />
        </CardContent>
      </Card>
    </div>
  )
}

export function EmployeePerformance({
  today,
  week,
  month,
  year,
  allTime,
}: EmployeePerformanceProps) {
  const t = useTranslations("employeeDetail")
  const [period, setPeriod] = useState("today")

  const periodData: Record<string, PeriodStats> = {
    today,
    week,
    month,
    year,
    allTime,
  }

  return (
    <Tabs value={period} onValueChange={setPeriod}>
      <TabsList>
        <TabsTrigger value="today">{t("today")}</TabsTrigger>
        <TabsTrigger value="week">{t("thisWeek")}</TabsTrigger>
        <TabsTrigger value="month">{t("thisMonth")}</TabsTrigger>
        <TabsTrigger value="year">{t("thisYear")}</TabsTrigger>
        <TabsTrigger value="allTime">{t("allTime")}</TabsTrigger>
      </TabsList>

      <TabsContent value={period} className="mt-4">
        <PeriodStatsView stats={periodData[period]} />
      </TabsContent>
    </Tabs>
  )
}

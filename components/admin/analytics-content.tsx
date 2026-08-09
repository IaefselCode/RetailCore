"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import {
  TrendingUpIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  WalletIcon,
  PackageIcon,
  DownloadIcon,
  BarChart3,
  LineChart as LineChartIcon,
  UsersIcon,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  DataTable,
  createAppColumnHelper,
} from "@/components/shared/data-table"
import { formatMoney } from "@/lib/money"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const MONTH_KEYS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export interface AnalyticsData {
  daily: { date: string; revenue: number; cost: number; profit: number; orders: number; units: number }[]
  dailyShops: {
    date: string
    shopId: string
    shopName: string
    revenue: number
    cost: number
    profit: number
    orders: number
    units: number
  }[]
  dailyEmployees: {
    date: string
    employeeId: string
    name: string
    shopName: string
    revenue: number
    profit: number
    orders: number
    units: number
  }[]
  dailyProducts: { date: string; name: string; revenue: number; profit: number; units: number }[]
  /** Earliest date key covered by the server query (for growth range checks). */
  dataStart: string
}

export type Granularity = "daily" | "weekly" | "monthly" | "yearly"

type TopMetric = "revenue" | "profit" | "units"

const GRANULARITY_OPTIONS: { value: Granularity; labelKey: string }[] = [
  { value: "daily", labelKey: "granularityDaily" },
  { value: "weekly", labelKey: "granularityWeekly" },
  { value: "monthly", labelKey: "granularityMonthly" },
  { value: "yearly", labelKey: "granularityYearly" },
]

const TOP_METRIC_OPTIONS: { value: TopMetric; labelKey: string }[] = [
  { value: "revenue", labelKey: "topByRevenue" },
  { value: "profit", labelKey: "topByProfit" },
  { value: "units", labelKey: "topByUnits" },
]

const PERIOD_KEYS: Record<Granularity, string> = {
  daily: "dailyPerformance",
  weekly: "weeklyPerformance",
  monthly: "monthlyPerformance",
  yearly: "yearlyPerformance",
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function dayKeyOf(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function mondayOf(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

/**
 * Inclusive date-key bounds for the selected window plus the immediately
 * preceding window of equal length (used for growth). Definitions mirror
 * `bucketDaily` so the whole page always shows the same period.
 */
function getWindowKeys(granularity: Granularity) {
  const now = new Date()
  let start: Date
  let prevStart: Date
  let prevEnd: Date

  if (granularity === "daily") {
    // Last 30 days vs the 30 days before.
    start = addDays(now, -29)
    prevStart = addDays(now, -59)
    prevEnd = addDays(now, -30)
  } else if (granularity === "weekly") {
    // Last 12 weeks (Monday-start) vs the 12 weeks before.
    const weekStart = mondayOf(now)
    start = addDays(weekStart, -77)
    prevStart = addDays(weekStart, -154)
    prevEnd = addDays(weekStart, -78)
  } else if (granularity === "monthly") {
    // Last 12 months vs the 12 months before.
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    prevStart = new Date(now.getFullYear(), now.getMonth() - 23, 1)
    prevEnd = addDays(start, -1)
  } else {
    // Last 5 years vs the 5 years before.
    start = new Date(now.getFullYear() - 4, 0, 1)
    prevStart = new Date(now.getFullYear() - 9, 0, 1)
    prevEnd = addDays(start, -1)
  }

  return {
    startKey: dayKeyOf(start),
    endKey: dayKeyOf(now),
    prevStartKey: dayKeyOf(prevStart),
    prevEndKey: dayKeyOf(prevEnd),
  }
}

interface DayPoint {
  date: string
  revenue: number
  cost: number
  profit: number
  orders: number
  units: number
}

/**
 * Re-buckets per-day server data into the selected granularity,
 * zero-filling every bucket so the chart always spans the full window.
 */
function bucketDaily(daily: DayPoint[], granularity: Granularity) {
  const map = new Map(daily.map((d) => [d.date, d]))
  const now = new Date()
  const currentYear = now.getFullYear()
  const shortLabel = (d: Date) => {
    const base = `${MONTH_KEYS[d.getMonth()]} ${d.getDate()}`
    return d.getFullYear() === currentYear ? base : `${base} ${d.getFullYear()}`
  }

  const out: { label: string; revenue: number; cost: number; profit: number; orders: number; units: number }[] = []

  if (granularity === "daily") {
    // Last 30 days.
    for (let i = 29; i >= 0; i--) {
      const d = addDays(now, -i)
      const pt = map.get(dayKeyOf(d))
      out.push({
        label: shortLabel(d),
        revenue: pt?.revenue ?? 0,
        cost: pt?.cost ?? 0,
        profit: pt?.profit ?? 0,
        orders: pt?.orders ?? 0,
        units: pt?.units ?? 0,
      })
    }
  } else if (granularity === "weekly") {
    // Last 12 weeks, each starting on Monday.
    const weekStart = mondayOf(now)
    for (let i = 11; i >= 0; i--) {
      const ws = addDays(weekStart, -i * 7)
      const we = addDays(ws, 7)
      const acc = { revenue: 0, cost: 0, profit: 0, orders: 0, units: 0 }
      for (const [key, pt] of map) {
        const [y, m, day] = key.split("-").map(Number)
        const date = new Date(y, m - 1, day)
        if (date >= ws && date < we) {
          acc.revenue += pt.revenue
          acc.cost += pt.cost
          acc.profit += pt.profit
          acc.orders += pt.orders
          acc.units += pt.units
        }
      }
      out.push({ label: shortLabel(ws), ...acc })
    }
  } else if (granularity === "monthly") {
    // Last 12 months.
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const prefix = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
      const acc = { revenue: 0, cost: 0, profit: 0, orders: 0, units: 0 }
      for (const [key, pt] of map) {
        if (key.startsWith(prefix)) {
          acc.revenue += pt.revenue
          acc.cost += pt.cost
          acc.profit += pt.profit
          acc.orders += pt.orders
          acc.units += pt.units
        }
      }
      out.push({
        label: `${MONTH_KEYS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        ...acc,
      })
    }
  } else {
    // Last 5 years.
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i
      const prefix = `${year}-`
      const acc = { revenue: 0, cost: 0, profit: 0, orders: 0, units: 0 }
      for (const [key, pt] of map) {
        if (key.startsWith(prefix)) {
          acc.revenue += pt.revenue
          acc.cost += pt.cost
          acc.profit += pt.profit
          acc.orders += pt.orders
          acc.units += pt.units
        }
      }
      out.push({ label: String(year), ...acc })
    }
  }

  return out
}

interface ShopRow {
  name: string
  revenue: number
  cost: number
  profit: number
  units: number
  orders: number
  growth: number | null
}

const shopHelper = createAppColumnHelper<ShopRow>()

function ShopTable({ shops }: { shops: ShopRow[] }) {
  const t = useTranslations("analytics")
  const tc = useTranslations("common")
  const columns = shopHelper.columns([
    shopHelper.accessor("name", {
      header: t("colShop"),
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    }),
    shopHelper.accessor("revenue", {
      header: t("colRevenue"),
      cell: ({ getValue }) => <span className="font-medium">{formatMoney(getValue() as number)}</span>,
    }),
    shopHelper.accessor("cost", {
      header: t("colCost"),
      cell: ({ getValue }) => <span className="text-muted-foreground">{formatMoney(getValue() as number)}</span>,
    }),
    shopHelper.accessor("profit", {
      header: t("colProfit"),
      cell: ({ getValue }) => (
        <span className={getValue() as number >= 0 ? "font-medium" : "font-medium text-destructive"}>
          {formatMoney(getValue() as number)}
        </span>
      ),
    }),
    shopHelper.accessor("units", { header: t("colUnits"), cell: ({ getValue }) => getValue() as number }),
    shopHelper.accessor("orders", { header: t("colOrders"), cell: ({ getValue }) => getValue() as number }),
    shopHelper.accessor("growth", {
      header: t("colGrowth"),
      cell: ({ getValue }) => {
        const g = getValue() as number | null
        if (g === null) {
          // Previous equal-length window predates available data.
          return <span className="text-muted-foreground">—</span>
        }
        return (
          <Badge variant={g >= 0 ? "default" : "destructive"}>
            {g >= 0 ? "+" : ""}
            {g.toFixed(1)}%
          </Badge>
        )
      },
    }),
  ])
  return (
    <DataTable
      data={shops}
      columns={columns}
      getRowId={(row) => row.name}
      empty={tc("noData")}
    />
  )
}

interface EmployeeRow {
  name: string
  shopName: string
  revenue: number
  profit: number
  units: number
  orders: number
}

const employeeHelper = createAppColumnHelper<EmployeeRow>()

function EmployeePerformanceTable({ employees }: { employees: EmployeeRow[] }) {
  const t = useTranslations("analytics")
  const tc = useTranslations("common")
  const columns = employeeHelper.columns([
    employeeHelper.accessor("name", {
      header: t("colEmployee"),
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    }),
    employeeHelper.accessor("shopName", { header: t("colShop"), cell: ({ getValue }) => getValue() as string }),
    employeeHelper.accessor("orders", { header: t("colSalesCount"), cell: ({ getValue }) => getValue() as number }),
    employeeHelper.accessor("units", { header: t("colUnits"), cell: ({ getValue }) => getValue() as number }),
    employeeHelper.accessor("revenue", {
      header: t("colRevenue"),
      cell: ({ getValue }) => <span className="font-medium">{formatMoney(getValue() as number)}</span>,
    }),
    employeeHelper.accessor("profit", {
      header: t("colProfit"),
      cell: ({ getValue }) => (
        <span className={getValue() as number >= 0 ? "font-medium" : "font-medium text-destructive"}>
          {formatMoney(getValue() as number)}
        </span>
      ),
    }),
  ])
  return (
    <DataTable
      data={employees}
      columns={columns}
      getRowId={(row) => row.name}
      empty={tc("noData")}
    />
  )
}

type ChartMode = "bar" | "line"

export function AnalyticsContent({
  data,
  initialView = "monthly",
}: {
  data: AnalyticsData
  /** Granularity restored from the `?view=` URL param on refresh/share. */
  initialView?: Granularity
}) {
  const t = useTranslations("analytics")
  const tc = useTranslations("common")
  const [granularity, setGranularity] = useState<Granularity>(initialView)
  const [chartMode, setChartMode] = useState<ChartMode>("bar")
  const [topMetric, setTopMetric] = useState<TopMetric>("revenue")

  function changeGranularity(v: Granularity) {
    setGranularity(v)
    // Silently keep the URL in sync (?view=weekly) so a refreshed or shared
    // link restores the same view — no server re-query for a client-only toggle.
    const url = new URL(window.location.href)
    url.searchParams.set("view", v)
    window.history.replaceState(null, "", url)
  }

  const chartData = useMemo(() => bucketDaily(data.daily, granularity), [data.daily, granularity])

  // Every section below shares the selected window (and the preceding window
  // for growth), so the whole page shifts together when granularity changes.
  const { startKey, endKey, prevStartKey, prevEndKey } = getWindowKeys(granularity)
  const growthUnknown = prevEndKey < data.dataStart

  const summary = useMemo(() => {
    const windowRevenue = chartData.reduce((sum, b) => sum + b.revenue, 0)
    const windowCost = chartData.reduce((sum, b) => sum + b.cost, 0)
    const windowProfit = chartData.reduce((sum, b) => sum + b.profit, 0)
    const windowUnits = chartData.reduce((sum, b) => sum + b.units, 0)
    const windowOrders = chartData.reduce((sum, b) => sum + b.orders, 0)

    // Top Products for the window (revenue/profit/units all aggregated, the
    // active metric only decides ranking + display).
    const prodAgg = new Map<string, { revenue: number; profit: number; units: number }>()
    for (const p of data.dailyProducts) {
      if (p.date >= startKey && p.date <= endKey) {
        const entry = prodAgg.get(p.name) ?? { revenue: 0, profit: 0, units: 0 }
        entry.revenue += p.revenue
        entry.profit += p.profit
        entry.units += p.units
        prodAgg.set(p.name, entry)
      }
    }
    const sortedProducts = [...prodAgg.entries()].sort((a, b) => b[1][topMetric] - a[1][topMetric]).slice(0, 5)
    const maxProductValue = sortedProducts[0]?.[1][topMetric] ?? 1
    const topProducts = sortedProducts.map(([name, v]) => ({
      name,
      revenue: v.revenue,
      profit: v.profit,
      units: v.units,
      metricValue: v[topMetric],
      percentage: Math.max(2, Math.round((v[topMetric] / maxProductValue) * 100)),
    }))

    // Sales by Shop for the window, with growth vs the preceding window.
    const shopAgg = new Map<
      string,
      { name: string; revenue: number; cost: number; profit: number; units: number; orders: number; prevRevenue: number }
    >()
    for (const s of data.dailyShops) {
      if (s.date >= startKey && s.date <= endKey) {
        const entry =
          shopAgg.get(s.shopId) ??
          { name: s.shopName, revenue: 0, cost: 0, profit: 0, units: 0, orders: 0, prevRevenue: 0 }
        entry.revenue += s.revenue
        entry.cost += s.cost
        entry.profit += s.profit
        entry.units += s.units
        entry.orders += s.orders
        shopAgg.set(s.shopId, entry)
      } else if (s.date >= prevStartKey && s.date <= prevEndKey) {
        const entry = shopAgg.get(s.shopId) ?? { name: s.shopName, revenue: 0, cost: 0, profit: 0, units: 0, orders: 0, prevRevenue: 0 }
        entry.prevRevenue += s.revenue
        shopAgg.set(s.shopId, entry)
      }
    }
    const shopRows: ShopRow[] = [...shopAgg.values()]
      .filter((s) => s.revenue > 0 || s.orders > 0 || s.prevRevenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .map((s) => ({
        name: s.name,
        revenue: s.revenue,
        cost: s.cost,
        profit: s.profit,
        units: s.units,
        orders: s.orders,
        growth:
          growthUnknown
            ? null
            : s.prevRevenue > 0
            ? ((s.revenue - s.prevRevenue) / s.prevRevenue) * 100
            : 0,
      }))

    // Employee performance for the window.
    const empAgg = new Map<
      string,
      { name: string; shopName: string; revenue: number; profit: number; units: number; orders: number }
    >()
    for (const e of data.dailyEmployees) {
      if (e.date >= startKey && e.date <= endKey) {
        const entry =
          empAgg.get(e.employeeId) ??
          { name: e.name, shopName: e.shopName, revenue: 0, profit: 0, units: 0, orders: 0 }
        entry.revenue += e.revenue
        entry.profit += e.profit
        entry.units += e.units
        entry.orders += e.orders
        empAgg.set(e.employeeId, entry)
      }
    }
    const employeeRows: EmployeeRow[] = [...empAgg.values()]
      .filter((e) => e.revenue > 0 || e.orders > 0)
      .sort((a, b) => b.revenue - a.revenue)

    return {
      windowRevenue,
      windowCost,
      windowProfit,
      windowUnits,
      windowOrders,
      topProducts,
      shopRows,
      employeeRows,
    }
  }, [chartData, data.dailyProducts, data.dailyShops, data.dailyEmployees, startKey, endKey, prevStartKey, prevEndKey, growthUnknown, topMetric])

  const kpis = [
    { labelKey: "revenue", value: formatMoney(summary.windowRevenue), icon: DollarSignIcon },
    { labelKey: "cost", value: formatMoney(summary.windowCost), icon: WalletIcon },
    { labelKey: "profit", value: formatMoney(summary.windowProfit), icon: TrendingUpIcon },
    { labelKey: "unitsSold", value: summary.windowUnits.toLocaleString(), icon: PackageIcon },
    { labelKey: "orders", value: summary.windowOrders.toLocaleString(), icon: ShoppingCartIcon },
  ]

  const chartConfig: ChartConfig = {
    revenue: {
      label: t("revenueSeries"),
      color: "hsl(var(--primary))",
    },
    profit: {
      label: t("profitSeries"),
      color: "#60a5fa",
    },
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-medium">{t("title")}</h1>
        <Select value={granularity} onValueChange={(v) => v && changeGranularity(v as Granularity)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {kpis.map((kpi) => (
          <motion.div key={kpi.labelKey} variants={itemVariants}>
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">{t(kpi.labelKey)}</CardTitle>
                <kpi.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{kpi.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{t("revenueOverTime")}</CardTitle>
            <CardDescription>{t(PERIOD_KEYS[granularity])}</CardDescription>
          </div>
          <div className="flex items-center gap-0.5 rounded-md border p-0.5">
            <AnimateButton
              size="icon-sm"
              variant={chartMode === "bar" ? "default" : "ghost"}
              onClick={() => setChartMode("bar")}
              aria-label={t("chartBar")}
              aria-pressed={chartMode === "bar"}
            >
              <BarChart3 className="size-4" />
            </AnimateButton>
            <AnimateButton
              size="icon-sm"
              variant={chartMode === "line" ? "default" : "ghost"}
              onClick={() => setChartMode("line")}
              aria-label={t("chartLine")}
              aria-pressed={chartMode === "line"}
            >
              <LineChartIcon className="size-4" />
            </AnimateButton>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            {chartMode === "bar" ? (
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dashed"
                      formatter={(value) => formatMoney(Number(value))}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
              </BarChart>
            ) : (
              <LineChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value) => formatMoney(Number(value))}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  dataKey="revenue"
                  type="natural"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  dataKey="profit"
                  type="natural"
                  stroke="var(--color-profit)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            )}
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("topProducts")}</CardTitle>
            <CardDescription>{t("topProductsDesc")}</CardDescription>
            <div className="flex flex-wrap gap-1 pt-1">
              {TOP_METRIC_OPTIONS.map((opt) => (
                <AnimateButton
                  key={opt.value}
                  size="sm"
                  variant={topMetric === opt.value ? "default" : "outline"}
                  onClick={() => setTopMetric(opt.value)}
                  aria-pressed={topMetric === opt.value}
                >
                  {t(opt.labelKey)}
                </AnimateButton>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {summary.topProducts.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{tc("noData")}</p>
            )}
            {summary.topProducts.map((product, i) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate">{i + 1}. {product.name}</span>
                  <span className="text-muted-foreground">
                    {topMetric === "units"
                      ? `${product.metricValue.toLocaleString()} ${t("unitsShort")}`
                      : formatMoney(product.metricValue)}
                  </span>
                </div>
                <Progress value={product.percentage}>
                  <ProgressTrack>
                    <ProgressIndicator />
                  </ProgressTrack>
                </Progress>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("salesByShop")}</CardTitle>
            <CardDescription>{t("revenueBreakdown")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ShopTable shops={summary.shopRows} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4 text-primary" /> {t("employeePerformance")}
          </CardTitle>
          <CardDescription>{t("employeePerformanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeePerformanceTable employees={summary.employeeRows} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <AnimateButton variant="outline">
          <DownloadIcon />
          {t("exportReport")}
        </AnimateButton>
      </div>
    </div>
  )
}

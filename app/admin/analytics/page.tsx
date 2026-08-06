"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { ChevronRightIcon, DownloadIcon, TrendingUpIcon, ShoppingCartIcon, TargetIcon, DollarSignIcon } from "lucide-react"
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
  DataTable,
  createAppColumnHelper,
} from "@/components/shared/data-table"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const kpis = [
  { labelKey: "revenue", value: "$312,800", change: "+12.5%", icon: DollarSignIcon, positive: true },
  { labelKey: "orders", value: "1,247", change: "+8.3%", icon: ShoppingCartIcon, positive: true },
  { labelKey: "conversionRate", value: "3.2%", change: "-0.4%", icon: TargetIcon, positive: false },
  { labelKey: "avgOrderValue", value: "$250", change: "+5.1%", icon: TrendingUpIcon, positive: true },
]

const topProducts = [
  { name: "SonicFlow X1 Headphones", revenue: 45200, percentage: 85 },
  { name: "PixelView 4K Monitor", revenue: 38900, percentage: 73 },
  { name: "ErgoDesk Pro Standing Desk", revenue: 32100, percentage: 60 },
  { name: "QuantumShift Mechanical Keyboard", revenue: 28400, percentage: 53 },
  { name: "AeroGlide Wireless Mouse", revenue: 22500, percentage: 42 },
]

const shops = [
  { name: "Downtown Flagship", revenue: "$98,400", orders: 342, growth: "+12.3%" },
  { name: "Mall of America", revenue: "$76,200", orders: 285, growth: "+8.7%" },
  { name: "Westside Plaza", revenue: "$54,800", orders: 208, growth: "+5.1%" },
  { name: "Eastside Boutique", revenue: "$41,500", orders: 167, growth: "+15.2%" },
  { name: "Airport Terminal 3", revenue: "$28,900", orders: 124, growth: "-2.4%" },
]

const chartData = [35, 55, 42, 78, 61, 90, 75, 85, 68, 95, 72, 88]

interface ShopRow {
  name: string
  revenue: string
  orders: number
  growth: string
}

const shopHelper = createAppColumnHelper<ShopRow>()

function ShopTable() {
  const t = useTranslations("analytics")
  const columns = shopHelper.columns([
    shopHelper.accessor("name", {
      header: t("colShop"),
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    }),
    shopHelper.accessor("revenue", { header: t("colRevenue"), cell: ({ getValue }) => getValue() as string }),
    shopHelper.accessor("orders", { header: t("colOrders"), cell: ({ getValue }) => getValue() as number }),
    shopHelper.accessor("growth", {
      header: t("colGrowth"),
      cell: ({ getValue }) => {
        const g = getValue() as string
        return (
          <Badge variant={g.startsWith("+") ? "default" : "destructive"}>
            {g}
          </Badge>
        )
      },
    }),
  ])
  return <DataTable data={shops} columns={columns} getRowId={(row) => row.name} />
}

export default function AnalyticsPage() {
  const t = useTranslations("analytics")
  const tc = useTranslations("common")
  const [dateRange, setDateRange] = useState("30")

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{tc("home")}</span>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground">{t("breadcrumb")}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-medium">{t("title")}</h1>
        <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t("last7")}</SelectItem>
            <SelectItem value="30">{t("last30")}</SelectItem>
            <SelectItem value="90">{t("last90")}</SelectItem>
            <SelectItem value="365">{t("lastYear")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
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
                <Badge variant={kpi.positive ? "default" : "destructive"} className="mt-1">
                  {kpi.change}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("revenueOverTime")}</CardTitle>
            <CardDescription>{t("monthlyPerformance")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {chartData.map((height, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1 h-full">
                  <motion.div
                    className="w-full rounded-t-sm bg-primary/20 hover:bg-primary/40 transition-colors"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
              <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("topProducts")}</CardTitle>
            <CardDescription>{t("byRevenue")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {topProducts.map((product, i) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate">{i + 1}. {product.name}</span>
                  <span className="text-muted-foreground">${product.revenue.toLocaleString()}</span>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("salesByShop")}</CardTitle>
          <CardDescription>{t("revenueBreakdown")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ShopTable />
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

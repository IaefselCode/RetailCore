"use client"

import { useState } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const kpis = [
  { label: "Revenue", value: "$312,800", change: "+12.5%", icon: DollarSignIcon, positive: true },
  { label: "Orders", value: "1,247", change: "+8.3%", icon: ShoppingCartIcon, positive: true },
  { label: "Conversion Rate", value: "3.2%", change: "-0.4%", icon: TargetIcon, positive: false },
  { label: "Avg Order Value", value: "$250", change: "+5.1%", icon: TrendingUpIcon, positive: true },
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

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30")

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>Home</span>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground">Analytics</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-medium">Business Analytics</h1>
        <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
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
          <motion.div key={kpi.label} variants={itemVariants}>
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">{kpi.label}</CardTitle>
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
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue performance</CardDescription>
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
            <CardTitle>Top Products</CardTitle>
            <CardDescription>By revenue</CardDescription>
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
          <CardTitle>Sales by Shop</CardTitle>
          <CardDescription>Revenue breakdown across all locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((shop) => (
                <TableRow key={shop.name}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>{shop.revenue}</TableCell>
                  <TableCell>{shop.orders}</TableCell>
                  <TableCell>
                    <Badge variant={shop.growth.startsWith("+") ? "default" : "destructive"}>
                      {shop.growth}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <AnimateButton variant="outline">
          <DownloadIcon />
          Export Report
        </AnimateButton>
      </div>
    </div>
  )
}

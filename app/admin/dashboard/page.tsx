'use client'

import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button as AnimatedButton } from "@/components/ui/animated-button"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  ArrowRight,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Completed: "default",
  Pending: "secondary",
  Cancelled: "destructive",
}

const kpiData = [
  {
    title: t("totalSales"),
    value: "$284,500",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: t("totalOrders"),
    value: "1,247",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    title: t("revenue"),
    value: "$312,800",
    change: "+15.3%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: t("activeCustomers"),
    value: "8,432",
    change: "-2.1%",
    trend: "down",
    icon: Users,
  },
]

const recentSales = [
  { id: "TXN-001", customer: "Alice Johnson", product: "Wireless Mouse", amount: "$45.00", status: "Completed" },
  { id: "TXN-002", customer: "Bob Smith", product: "Mechanical Keyboard", amount: "$129.99", status: "Pending" },
  { id: "TXN-003", customer: "Carol White", product: "USB-C Hub", amount: "$34.50", status: "Completed" },
  { id: "TXN-004", customer: "David Brown", product: "27\" Monitor", amount: "$349.00", status: "Cancelled" },
  { id: "TXN-005", customer: "Eve Davis", product: "Laptop Stand", amount: "$59.99", status: "Completed" },
]

const lowStockProducts = [
  { name: "Wireless Mouse", stock: 3, reorder: 10 },
  { name: "USB-C Cable", stock: 5, reorder: 25 },
  { name: "HDMI Adapter", stock: 2, reorder: 15 },
  { name: "Desk Lamp", stock: 8, reorder: 20 },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default function DashboardPage() {
  const t = useTranslations("dashboard")
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("greetingMorning")}, Admin
        </h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {kpiData.map((kpi) => (
          <motion.div key={kpi.title} variants={itemVariants}>
            <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <kpi.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="size-3 text-green-500" />
                  ) : (
                    <TrendingDown className="size-3 text-red-500" />
                  )}
                  <span className={kpi.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {kpi.change}
                  </span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="flex flex-wrap gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <AnimateButton variant="accent" asChild>
            <Link href="/admin/products/add">
              <Package /> Add Product
            </Link>
          </AnimateButton>
        </motion.div>
        <motion.div variants={itemVariants}>
          <AnimateButton variant="outline" asChild>
            <Link href="/admin/shops/create/general-info">
              <ShoppingCart /> Create Shop
            </Link>
          </AnimateButton>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("transactionId")}</TableHead>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{sale.product}</TableCell>
                    <TableCell>{sale.amount}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[sale.status]}>{sale.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                key={product.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {product.stock} / Reorder at: {product.reorder}
                    </p>
                  </div>
                </div>
                <AnimateButton size="sm" variant="outline" asChild>
                  <Link href="/admin/inventory">
                    Restock <ArrowRight className="size-3" />
                  </Link>
                </AnimateButton>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

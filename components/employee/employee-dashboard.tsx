"use client"

import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Package, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ActivitiesCard, type ActivityItemType } from "@/components/ui/activities-card"
import { AnimateButton } from "@/components/ui/animate-button"
import { formatMoney } from "@/lib/money"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export interface EmployeeRecentSale {
  invoiceNo: string
  total: number
  createdAt: string
}

export interface EmployeeLowStockItem {
  name: string
  sku: string
  quantity: number
  minStock: number
}

interface EmployeeDashboardProps {
  firstName: string
  shopName: string
  todaySales: number
  ordersToday: number
  lowStockCount: number
  monthSales: number
  stockUnits: number
  recentSales: EmployeeRecentSale[]
  lowStock: EmployeeLowStockItem[]
}

export function EmployeeDashboard({
  firstName,
  shopName,
  todaySales,
  ordersToday,
  lowStockCount,
  monthSales,
  stockUnits,
  recentSales,
  lowStock,
}: EmployeeDashboardProps) {
  const t = useTranslations("dashboard")
  const tEmployee = useTranslations("employeeDashboard")

  const kpis = [
    {
      title: "Today's Sales",
      value: formatMoney(todaySales),
      icon: DollarSign,
      description: `${shopName}`,
    },
    {
      title: "Orders Today",
      value: String(ordersToday),
      icon: ShoppingCart,
      description: "Completed today",
    },
    {
      title: tEmployee("lowStockAlerts"),
      value: String(lowStockCount),
      icon: AlertTriangle,
      description: "Below reorder level",
    },
    {
      title: "My Month",
      value: formatMoney(monthSales),
      icon: TrendingUp,
      description: `${stockUnits} units in stock`,
    },
  ]

  const activities: ActivityItemType[] = recentSales.map((sale) => ({
    icon: <ShoppingCart className="size-5" />,
    title: sale.invoiceNo,
    desc: `Processed by you - ${formatMoney(sale.total)}`,
    time: timeAgo(sale.createdAt),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {getGreeting(new Date().getHours())}, {firstName}!
          </h1>
          <p className="text-sm text-muted-foreground">{tEmployee("today")}</p>
        </div>
        <Link href="/employee/record-sale">
          <AnimateButton variant="accent">
            Record Quick Sale
            <ArrowRight className="size-4" />
          </AnimateButton>
        </Link>
      </div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <motion.div key={kpi.title} variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription>{kpi.title}</CardDescription>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{kpi.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivitiesCard
          headerIcon={<ShoppingCart className="size-6 text-gray-500" />}
          title={tEmployee("recentActivity")}
          subtitle={tEmployee("lastTransactions")}
          activities={activities}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4 text-amber-500" /> {t("lowStockAlerts")}
              </CardTitle>
              <CardDescription>{t("productsBelowReorderLevel")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStock.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    All stock levels are healthy
                  </p>
                )}
                {lowStock.map((item) => (
                  <div
                    key={item.sku}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.quantity <= 0 ? "destructive" : "secondary"}>
                        {item.quantity} in stock
                      </Badge>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Reorder at {item.minStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

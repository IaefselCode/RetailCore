"use client"

import type { ReactNode } from "react"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Package, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { AnimateButton } from "@/components/ui/animate-button"

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

function getGreetingKey(hour: number) {
  if (hour < 12) return "greetingMorning"
  if (hour < 18) return "greetingAfternoon"
  return "greetingEvening"
}

interface EmployeeDashboardProps {
  firstName: string
  shopName: string
  kpiSlots: {
    todaySales: ReactNode
    ordersToday: ReactNode
    lowStockCount: ReactNode
    monthSales: ReactNode
    stockUnits: ReactNode
  }
  activityItems: ReactNode
  lowStockItems: ReactNode
}

export function EmployeeDashboard({
  firstName,
  shopName,
  kpiSlots,
  activityItems,
  lowStockItems,
}: EmployeeDashboardProps) {
  const t = useTranslations("dashboard")
  const tEmployee = useTranslations("employeeDashboard")
  const greeting = t(getGreetingKey(new Date().getHours()))

  const kpis = [
    {
      title: tEmployee("todaySales"),
      value: kpiSlots.todaySales,
      icon: DollarSign,
      description: shopName,
    },
    {
      title: tEmployee("ordersToday"),
      value: kpiSlots.ordersToday,
      icon: ShoppingCart,
      description: tEmployee("completedToday"),
    },
    {
      title: tEmployee("lowStockAlerts"),
      value: kpiSlots.lowStockCount,
      icon: AlertTriangle,
      description: tEmployee("belowReorder"),
    },
    {
      title: tEmployee("myMonth"),
      value: kpiSlots.monthSales,
      icon: TrendingUp,
      description: (
        <span className="inline-flex items-center gap-1">
          {kpiSlots.stockUnits}
          {tEmployee("unitsInStock", { count: "" }).trim()}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {firstName}!
          </h1>
          <p className="text-sm text-muted-foreground">{tEmployee("today")}</p>
        </div>
        <Link href="/employee/record-sale">
          <AnimateButton variant="accent">
            {tEmployee("recordQuickSale")}
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
                  <div className="text-xs text-muted-foreground">{kpi.description}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="size-4" /> {tEmployee("lastTransactions")}
              </CardTitle>
              <CardDescription>{tEmployee("recentActivity")}</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {activityItems}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4 text-amber-500" /> {t("lowStockAlerts")}
              </CardTitle>
              <CardDescription>{t("productsBelowReorderLevel")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">{lowStockItems}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

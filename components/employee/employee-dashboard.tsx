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

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

interface EmployeeDashboardProps {
  firstName: string
  shopName: string
  values: {
    todaySales: ReactNode
    ordersToday: ReactNode
    lowStockCount: ReactNode
    monthSales: ReactNode
    stockUnits: ReactNode
  }
  recentSalesSection: ReactNode
  lowStockSection: ReactNode
}

export function EmployeeDashboard({
  firstName,
  shopName,
  values,
  recentSalesSection,
  lowStockSection,
}: EmployeeDashboardProps) {
  const t = useTranslations("dashboard")
  const tEmployee = useTranslations("employeeDashboard")

  const kpis = [
    {
      title: "Today's Sales",
      value: values.todaySales,
      icon: DollarSign,
      description: shopName,
    },
    {
      title: "Orders Today",
      value: values.ordersToday,
      icon: ShoppingCart,
      description: "Completed today",
    },
    {
      title: tEmployee("lowStockAlerts"),
      value: values.lowStockCount,
      icon: AlertTriangle,
      description: "Below reorder level",
    },
    {
      title: "My Month",
      value: values.monthSales,
      icon: TrendingUp,
      description: <>{values.stockUnits} units in stock</>,
    },
  ]

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
        {recentSalesSection}

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
              <div className="space-y-3">{lowStockSection}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

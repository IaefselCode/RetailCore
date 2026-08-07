"use client"

import type { ReactNode } from "react"
import { motion } from "motion/react"
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
  Store,
  ShoppingBag,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimateButton } from "@/components/ui/animate-button"

function getGreetingKey(hour: number) {
  if (hour < 12) return "greetingMorning"
  if (hour < 18) return "greetingAfternoon"
  return "greetingEvening"
}

interface AdminDashboardProps {
  firstName: string | null
  kpiSlots: {
    todaySales: ReactNode
    ordersToday: ReactNode
    monthRevenue: ReactNode
    productCount: ReactNode
  }
  recentSalesContent: ReactNode
  lowStockItems: ReactNode
  analyticsSection: ReactNode
}

export function AdminDashboard({
  firstName,
  kpiSlots,
  recentSalesContent,
  lowStockItems,
  analyticsSection,
}: AdminDashboardProps) {
  const t = useTranslations("dashboard")
  const greeting = t(getGreetingKey(new Date().getHours()))

  const kpis = [
    {
      label: t("todaySales"),
      value: kpiSlots.todaySales,
      icon: DollarSign,
      hint: t("todaySalesHint"),
    },
    {
      label: t("ordersToday"),
      value: kpiSlots.ordersToday,
      icon: ShoppingCart,
      hint: t("ordersTodayHint"),
    },
    {
      label: t("monthRevenue"),
      value: kpiSlots.monthRevenue,
      icon: TrendingUp,
      hint: t("monthRevenueHint"),
    },
    {
      label: t("activeProducts"),
      value: kpiSlots.productCount,
      icon: Package,
      hint: t("activeProductsHint"),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <AnimateButton asChild variant="outline">
            <Link href="/admin/shops/create">
              <Plus className="size-4" /> {t("createShop")}
            </Link>
          </AnimateButton>
          <AnimateButton asChild>
            <Link href="/admin/products/add">
              <Plus className="size-4" /> {t("addProduct")}
            </Link>
          </AnimateButton>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <kpi.icon className="size-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.hint}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" /> {t("analyticsTitle")}
            </CardTitle>
            <CardDescription>{t("analyticsDesc")}</CardDescription>
          </div>
          <AnimateButton asChild variant="ghost" size="sm">
            <Link href="/admin/analytics">
              {t("viewAnalytics")} <ArrowRight className="size-4" />
            </Link>
          </AnimateButton>
        </CardHeader>
        <CardContent>{analyticsSection}</CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="size-4" /> {t("recentSales")}
              </CardTitle>
              <CardDescription>{t("latestTransactions")}</CardDescription>
            </div>
            <AnimateButton asChild variant="ghost" size="sm">
              <Link href="/admin/sales/history">
                {t("viewAll")} <ArrowRight className="size-4" />
              </Link>
            </AnimateButton>
          </CardHeader>
          <CardContent className="p-0">
            {recentSalesContent}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" /> {t("lowStockAlerts")}
            </CardTitle>
            <CardDescription>{t("productsBelowReorderLevel")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockItems}
            <div className="pt-2">
              <AnimateButton asChild variant="outline" size="sm" className="w-full">
                <Link href="/admin/inventory">
                  <Store className="size-4" /> {t("manageInventory")}
                </Link>
              </AnimateButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

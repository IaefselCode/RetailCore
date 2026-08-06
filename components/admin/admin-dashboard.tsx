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
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody } from "@/components/ui/table"
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
  recentSalesHeader: ReactNode
  recentSalesRows: ReactNode
  lowStockItems: ReactNode
}

export function AdminDashboard({
  firstName,
  kpiSlots,
  recentSalesHeader,
  recentSalesRows,
  lowStockItems,
}: AdminDashboardProps) {
  const t = useTranslations("dashboard")
  const greeting = t(getGreetingKey(new Date().getHours()))

  const kpis = [
    {
      label: "Today's Sales",
      value: kpiSlots.todaySales,
      icon: DollarSign,
      hint: "Completed sales today",
    },
    {
      label: "Orders Today",
      value: kpiSlots.ordersToday,
      icon: ShoppingCart,
      hint: "Invoices issued today",
    },
    {
      label: "This Month Revenue",
      value: kpiSlots.monthRevenue,
      icon: TrendingUp,
      hint: "Completed sales this month",
    },
    {
      label: "Active Products",
      value: kpiSlots.productCount,
      icon: Package,
      hint: "Products in catalog",
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
          <p className="text-sm text-muted-foreground">
            Here is what is happening across your stores today.
          </p>
        </div>
        <div className="flex gap-2">
          <AnimateButton asChild variant="outline">
            <Link href="/admin/shops/create">
              <Plus className="size-4" /> Create Shop
            </Link>
          </AnimateButton>
          <AnimateButton asChild>
            <Link href="/admin/products/add">
              <Plus className="size-4" /> Add Product
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="size-4" /> Recent Sales
              </CardTitle>
              <CardDescription>Latest 5 transactions</CardDescription>
            </div>
            <AnimateButton asChild variant="ghost" size="sm">
              <Link href="/admin/sales/history">
                View all <ArrowRight className="size-4" />
              </Link>
            </AnimateButton>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                {recentSalesHeader}
                <TableBody>{recentSalesRows}</TableBody>
              </Table>
            </div>
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
                  <Store className="size-4" /> Manage Inventory
                </Link>
              </AnimateButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

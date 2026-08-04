"use client"

import { motion } from "motion/react"
import { DollarSign, ShoppingCart, AlertTriangle, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ActivitiesCard, type ActivityItemType } from "@/components/ui/activities-card"
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

const kpis = [
  {
    title: "Today's Sales",
    value: "$1,245",
    icon: DollarSign,
    description: "+12% from yesterday",
  },
  {
    title: "Orders Today",
    value: "18",
    icon: ShoppingCart,
    description: "4 pending",
  },
  {
    title: "Low Stock Items",
    value: "3",
    icon: AlertTriangle,
    description: "Below reorder level",
  },
  {
    title: "Current Shift",
    value: "9AM-5PM",
    icon: Clock,
    description: "4h 32m remaining",
  },
]

const recentActivity: ActivityItemType[] = [
  {
    icon: <ShoppingCart className="size-5" />,
    title: "Sale #1042",
    desc: "Processed by you - $89.99",
    time: "2 min ago",
  },
  {
    icon: <ShoppingCart className="size-5" />,
    title: "Sale #1041",
    desc: "Processed by you - $156.50",
    time: "18 min ago",
  },
  {
    icon: <ShoppingCart className="size-5" />,
    title: "Sale #1040",
    desc: "Processed by you - $42.00",
    time: "45 min ago",
  },
  {
    icon: <ShoppingCart className="size-5" />,
    title: "Sale #1039",
    desc: "Processed by you - $210.75",
    time: "1h ago",
  },
  {
    icon: <ShoppingCart className="size-5" />,
    title: "Sale #1038",
    desc: "Processed by you - $67.25",
    time: "2h ago",
  },
]

const lowStockItems = [
  { name: "SonicFlow X1", sku: "SF-X1-001", stock: 2, reorder: 10 },
  { name: "PowerCharge Pro", sku: "PCP-002", stock: 5, reorder: 15 },
  { name: "DataSync Hub", sku: "DSH-003", stock: 1, reorder: 8 },
]

export default function EmployeeDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Good morning, Alex!</h1>
          <p className="text-sm text-muted-foreground">Here is your shift overview.</p>
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
          title="Recent Activity"
          subtitle="Your last 5 transactions"
          activities={recentActivity}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Products below reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.sku}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">{item.stock} in stock</Badge>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Reorder at {item.reorder}
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

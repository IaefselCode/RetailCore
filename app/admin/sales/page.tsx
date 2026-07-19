"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { DollarSign, TrendingUp, CalendarDays, ShoppingCart, ArrowUpRight } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const transactions = [
  { id: "TXN-001", customer: "Alice Johnson", items: 3, amount: 299.99, method: "Credit Card", date: "2026-07-18", status: "Completed" },
  { id: "TXN-002", customer: "Bob Smith", items: 1, amount: 79.99, method: "Cash", date: "2026-07-18", status: "Completed" },
  { id: "TXN-003", customer: "Carol Davis", items: 5, amount: 549.95, method: "Debit Card", date: "2026-07-17", status: "Pending" },
  { id: "TXN-004", customer: "David Wilson", items: 2, amount: 199.98, method: "Mobile Pay", date: "2026-07-17", status: "Completed" },
  { id: "TXN-005", customer: "Eve Martinez", items: 1, amount: 299.99, method: "Credit Card", date: "2026-07-16", status: "Refunded" },
  { id: "TXN-006", customer: "Frank Lee", items: 4, amount: 159.96, method: "Cash", date: "2026-07-16", status: "Completed" },
  { id: "TXN-007", customer: "Grace Kim", items: 2, amount: 89.98, method: "Mobile Pay", date: "2026-07-15", status: "Completed" },
  { id: "TXN-008", customer: "Henry Brown", items: 1, amount: 1299.99, method: "Credit Card", date: "2026-07-15", status: "Refunded" },
]

const statusBadge: Record<string, "default" | "secondary" | "outline" | "destructive" | "ghost" | "link"> = {
  Completed: "default",
  Pending: "secondary",
  Refunded: "destructive",
}

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Dashboard <span className="mx-1">/</span> <span className="text-foreground">Sales</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Sales Management</h1>
        <Link href="/employee/record-sale">
          <AnimateButton variant="accent">
            <ShoppingCart className="size-4" />
            Record New Sale
          </AnimateButton>
        </Link>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Sales</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-2xl font-bold">
              <DollarSign className="size-5 text-green-500" />
              $12,450
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-2xl font-bold">
              <TrendingUp className="size-5 text-blue-500" />
              $78,300
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>This Month</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-2xl font-bold">
              <CalendarDays className="size-5 text-purple-500" />
              $284,500
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Avg Order Value</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-2xl font-bold">
              <ArrowUpRight className="size-5 text-orange-500" />
              $228
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/admin/sales/history">
              <AnimateButton variant="link" size="sm">View Sales History</AnimateButton>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, i) => (
                <motion.tr
                  key={tx.id}
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                  <TableCell className="font-medium">{tx.customer}</TableCell>
                  <TableCell>{tx.items}</TableCell>
                  <TableCell>${tx.amount.toFixed(2)}</TableCell>
                  <TableCell>{tx.method}</TableCell>
                  <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[tx.status]}>{tx.status}</Badge>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

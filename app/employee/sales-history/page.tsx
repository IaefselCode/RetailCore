"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Calendar } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { AnimateButton } from "@/components/ui/animate-button"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
}

const transactions = [
  { id: "TXN-1042", customer: "John Smith", items: 3, amount: 89.99, date: "2026-07-18", status: "completed" as const },
  { id: "TXN-1041", customer: "Emily Davis", items: 1, amount: 156.50, date: "2026-07-18", status: "completed" as const },
  { id: "TXN-1040", customer: "Michael Brown", items: 2, amount: 42.00, date: "2026-07-18", status: "refunded" as const },
  { id: "TXN-1039", customer: "Sarah Wilson", items: 5, amount: 210.75, date: "2026-07-17", status: "completed" as const },
  { id: "TXN-1038", customer: "David Lee", items: 1, amount: 67.25, date: "2026-07-17", status: "completed" as const },
  { id: "TXN-1037", customer: "Anna Taylor", items: 4, amount: 189.99, date: "2026-07-17", status: "completed" as const },
  { id: "TXN-1036", customer: "James Johnson", items: 2, amount: 99.98, date: "2026-07-16", status: "completed" as const },
  { id: "TXN-1035", customer: "Olivia Martin", items: 1, amount: 349.99, date: "2026-07-16", status: "completed" as const },
  { id: "TXN-1034", customer: "William Garcia", items: 3, amount: 78.50, date: "2026-07-16", status: "completed" as const },
  { id: "TXN-1033", customer: "Sophia Martinez", items: 2, amount: 129.99, date: "2026-07-15", status: "completed" as const },
]

const statusConfig = {
  completed: { label: "Completed", variant: "default" as const },
  refunded: { label: "Refunded", variant: "secondary" as const },
  pending: { label: "Pending", variant: "outline" as const },
}

export default function SalesHistoryPage() {
  const [dateFilter, setDateFilter] = useState("")

  const filtered = dateFilter
    ? transactions.filter((t) => t.date.includes(dateFilter))
    : transactions

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard &gt; Sales</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sales History</h1>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter by date (YYYY-MM-DD)..."
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((txn, i) => {
                const status = statusConfig[txn.status]
                return (
                  <motion.tr
                    key={txn.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{txn.id}</TableCell>
                    <TableCell>{txn.customer}</TableCell>
                    <TableCell>{txn.items}</TableCell>
                    <TableCell>${txn.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{txn.date}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

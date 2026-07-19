"use client"

import { useState } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { Download, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

const history = [
  { id: "TXN-001", customer: "Alice Johnson", items: 3, amount: 299.99, method: "Credit Card", date: "2026-07-18", status: "Completed" },
  { id: "TXN-002", customer: "Bob Smith", items: 1, amount: 79.99, method: "Cash", date: "2026-07-18", status: "Completed" },
  { id: "TXN-003", customer: "Carol Davis", items: 5, amount: 549.95, method: "Debit Card", date: "2026-07-17", status: "Pending" },
  { id: "TXN-004", customer: "David Wilson", items: 2, amount: 199.98, method: "Mobile Pay", date: "2026-07-17", status: "Completed" },
  { id: "TXN-005", customer: "Eve Martinez", items: 1, amount: 299.99, method: "Credit Card", date: "2026-07-16", status: "Refunded" },
  { id: "TXN-006", customer: "Frank Lee", items: 4, amount: 159.96, method: "Cash", date: "2026-07-16", status: "Completed" },
  { id: "TXN-007", customer: "Grace Kim", items: 2, amount: 89.98, method: "Mobile Pay", date: "2026-07-15", status: "Completed" },
  { id: "TXN-008", customer: "Henry Brown", items: 1, amount: 1299.99, method: "Credit Card", date: "2026-07-15", status: "Refunded" },
  { id: "TXN-009", customer: "Ivy Chen", items: 3, amount: 449.97, method: "Debit Card", date: "2026-07-14", status: "Completed" },
  { id: "TXN-010", customer: "Jack Taylor", items: 1, amount: 39.99, method: "Cash", date: "2026-07-14", status: "Completed" },
]

const statusBadge: Record<string, "default" | "secondary" | "outline" | "destructive" | "ghost" | "link"> = {
  Completed: "default",
  Pending: "secondary",
  Refunded: "destructive",
}

export default function SalesHistoryPage() {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("all")

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        Home <span className="mx-1">/</span>
        <Link href="/admin/sales" className="hover:text-foreground">Sales</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">History</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Sales History</h1>
        <AnimateButton variant="outline">
          <Download className="size-4" />
          Export CSV
        </AnimateButton>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Payment Method</label>
          <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="Credit Card">Credit Card</SelectItem>
              <SelectItem value="Debit Card">Debit Card</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Mobile Pay">Mobile Pay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
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
            {history.map((tx, i) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
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
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page 1 of 10</p>
        <div className="flex gap-2">
          <AnimateButton variant="outline" size="sm" disabled>
            <ChevronLeft className="size-4" />
            Previous
          </AnimateButton>
          <AnimateButton variant="outline" size="sm">
            Next
            <ChevronRight className="size-4" />
          </AnimateButton>
        </div>
      </div>
    </div>
  )
}

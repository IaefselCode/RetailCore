'use client'

import { motion } from "motion/react"
import { use } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimateButton } from "@/components/ui/animate-button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Store,
  MapPin,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowLeft,
  ChevronRight,
  Home,
} from "lucide-react"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
}

const shopData = {
  id: "1",
  name: "Central Plaza Hub",
  location: "123 Central Ave, Downtown",
  type: "Retail",
  status: "Active" as const,
  revenue: "$124,500",
  orders: 342,
  employees: 12,
  stockItems: 1_850,
}

const employees = [
  { name: "Sarah Connor", role: "Store Manager", email: "sarah@retailcore.com", phone: "+1-555-0101" },
  { name: "James Rodriguez", role: "Sales Associate", email: "james@retailcore.com", phone: "+1-555-0102" },
  { name: "Emily Taylor", role: "Cashier", email: "emily@retailcore.com", phone: "+1-555-0103" },
  { name: "Michael Brown", role: "Inventory Clerk", email: "michael@retailcore.com", phone: "+1-555-0104" },
  { name: "Jessica Lee", role: "Sales Associate", email: "jessica@retailcore.com", phone: "+1-555-0105" },
]

const transactions = [
  { id: "TXN-101", customer: "Alice Johnson", product: "Wireless Mouse", amount: "$45.00", date: "2026-07-15", status: "Completed" },
  { id: "TXN-102", customer: "Bob Smith", product: "Keyboard", amount: "$89.99", date: "2026-07-15", status: "Completed" },
  { id: "TXN-103", customer: "Carol White", product: "Monitor 27\"", amount: "$349.00", date: "2026-07-14", status: "Pending" },
  { id: "TXN-104", customer: "David Brown", product: "USB Hub", amount: "$34.50", date: "2026-07-14", status: "Completed" },
  { id: "TXN-105", customer: "Eve Davis", product: "Laptop Stand", amount: "$59.99", date: "2026-07-13", status: "Cancelled" },
]

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Completed: "default",
  Pending: "secondary",
  Cancelled: "destructive",
}

export default function ShopDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <Link href="/admin" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/admin/shops" className="hover:text-foreground">Shops</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{shopData.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
            <Store className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{shopData.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {shopData.location}
              <Badge variant={shopData.status === "Active" ? "default" : "secondary"}>
                {shopData.status}
              </Badge>
            </div>
          </div>
        </div>
        <AnimateButton variant="outline" asChild>
          <Link href="/admin/shops">
            <ArrowLeft /> Back to Shops
          </Link>
        </AnimateButton>
      </div>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shopData.revenue}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
              <ShoppingCart className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shopData.orders}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shopData.employees}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stock Items</CardTitle>
              <Package className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shopData.stockItems.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp, i) => (
                <motion.tr
                  key={emp.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.phone}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.id}</TableCell>
                  <TableCell>{txn.customer}</TableCell>
                  <TableCell>{txn.product}</TableCell>
                  <TableCell>{txn.amount}</TableCell>
                  <TableCell>{txn.date}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[txn.status]}>{txn.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

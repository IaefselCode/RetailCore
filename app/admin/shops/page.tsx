'use client'

import { useState } from "react"
import { motion } from "motion/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Store,
  Search,
  Plus,
  MapPin,
  ChevronRight,
  Home,
} from "lucide-react"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const shops = [
  { id: "1", name: "Central Plaza Hub", location: "123 Central Ave, Downtown", type: "Retail", status: "Active", manager: "Sarah Connor", revenue: "$124,500" },
  { id: "2", name: "Downtown Flagship", location: "456 Main St, City Center", type: "Retail", status: "Active", manager: "John Miller", revenue: "$98,200" },
  { id: "3", name: "Mall Location", location: "789 Mall Blvd, Westside", type: "Outlet", status: "Active", manager: "Emma Wilson", revenue: "$76,800" },
  { id: "4", name: "Eastside Warehouse", location: "321 Industrial Pkwy, Eastside", type: "Warehouse", status: "Inactive", manager: "N/A", revenue: "$0" },
  { id: "5", name: "Airport Pop-Up", location: "Terminal 2, International Airport", type: "Pop-up", status: "Active", manager: "Mike Chen", revenue: "$34,200" },
  { id: "6", name: "Northside Outlet", location: "555 North Rd, Northside", type: "Outlet", status: "Active", manager: "Lisa Park", revenue: "$52,100" },
]

export default function ShopsPage() {
  const [search, setSearch] = useState("")

  const filtered = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase()) ||
      s.type.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = shops.filter((s) => s.status === "Active").length
  const inactiveCount = shops.filter((s) => s.status === "Inactive").length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <span>Home</span>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Shops</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shop Management</h1>
          <p className="text-sm text-muted-foreground">Manage all retail locations</p>
        </div>
        <AnimateButton variant="accent" asChild>
          <Link href="/admin/shops/create/general-info">
            <Plus /> Add Shop
          </Link>
        </AnimateButton>
      </div>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Shops</CardTitle>
              <Store className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shops.length}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              <Store className="size-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
              <Store className="size-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search shops..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((shop, i) => (
                <motion.tr
                  key={shop.id}
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <Link href={`/admin/shops/${shop.id}`} className="hover:underline">
                      {shop.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3 text-muted-foreground" />
                      {shop.location}
                    </div>
                  </TableCell>
                  <TableCell>{shop.type}</TableCell>
                  <TableCell>
                    <Badge variant={shop.status === "Active" ? "default" : "secondary"}>
                      {shop.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{shop.manager}</TableCell>
                  <TableCell>{shop.revenue}</TableCell>
                  <TableCell>
                    <AnimateButton size="sm" variant="outline" asChild>
                      <Link href={`/admin/shops/${shop.id}`}>
                        View <ChevronRight className="size-3" />
                      </Link>
                    </AnimateButton>
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

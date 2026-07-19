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
  Users,
  Search,
  Plus,
  ChevronRight,
  Home,
} from "lucide-react"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const employees = [
  { id: "1", name: "Sarah Connor", role: "Store Manager", department: "Management", shop: "Central Plaza Hub", status: "Active", hireDate: "2024-03-15" },
  { id: "2", name: "John Miller", role: "Store Manager", department: "Management", shop: "Downtown Flagship", status: "Active", hireDate: "2024-06-01" },
  { id: "3", name: "Emma Wilson", role: "Sales Associate", department: "Sales", shop: "Mall Location", status: "Active", hireDate: "2024-08-20" },
  { id: "4", name: "Mike Chen", role: "Store Manager", department: "Management", shop: "Airport Pop-Up", status: "Active", hireDate: "2025-01-10" },
  { id: "5", name: "Lisa Park", role: "Assistant Manager", department: "Management", shop: "Northside Outlet", status: "Active", hireDate: "2024-11-05" },
  { id: "6", name: "James Rodriguez", role: "Sales Associate", department: "Sales", shop: "Central Plaza Hub", status: "On Leave", hireDate: "2024-04-22" },
  { id: "7", name: "Emily Taylor", role: "Cashier", department: "Operations", shop: "Central Plaza Hub", status: "Active", hireDate: "2025-02-14" },
  { id: "8", name: "Michael Brown", role: "Inventory Clerk", department: "Operations", shop: "Eastside Warehouse", status: "Active", hireDate: "2024-09-30" },
  { id: "9", name: "Jessica Lee", role: "Sales Associate", department: "Sales", shop: "Downtown Flagship", status: "On Leave", hireDate: "2024-07-18" },
  { id: "10", name: "David Wilson", role: "Cashier", department: "Operations", shop: "Mall Location", status: "Active", hireDate: "2025-03-01" },
  { id: "11", name: "Anna Martinez", role: "Sales Associate", department: "Sales", shop: "Northside Outlet", status: "Active", hireDate: "2024-12-12" },
  { id: "12", name: "Robert Kim", role: "Assistant Manager", department: "Management", shop: "Downtown Flagship", status: "Active", hireDate: "2024-05-08" },
  { id: "13", name: "Amanda White", role: "Store Manager", department: "Management", shop: "Eastside Warehouse", status: "Active", hireDate: "2024-02-20" },
  { id: "14", name: "Chris Evans", role: "Sales Associate", department: "Sales", shop: "Airport Pop-Up", status: "Terminated", hireDate: "2024-10-05" },
  { id: "15", name: "Sophia Clark", role: "Cashier", department: "Operations", shop: "Northside Outlet", status: "Active", hireDate: "2025-04-01" },
  { id: "16", name: "Daniel Harris", role: "Sales Associate", department: "Sales", shop: "Mall Location", status: "Active", hireDate: "2025-05-15" },
  { id: "17", name: "Olivia Lewis", role: "Inventory Clerk", department: "Operations", shop: "Downtown Flagship", status: "On Leave", hireDate: "2024-08-10" },
  { id: "18", name: "Nathan Walker", role: "Sales Associate", department: "Sales", shop: "Central Plaza Hub", status: "Active", hireDate: "2025-06-20" },
  { id: "19", name: "Isabella Hall", role: "Assistant Manager", department: "Management", shop: "Mall Location", status: "Active", hireDate: "2024-07-01" },
  { id: "20", name: "Ethan Allen", role: "Cashier", department: "Operations", shop: "Airport Pop-Up", status: "Active", hireDate: "2025-01-25" },
  { id: "21", name: "Mia Young", role: "Sales Associate", department: "Sales", shop: "Eastside Warehouse", status: "Active", hireDate: "2025-02-28" },
  { id: "22", name: "Alexander King", role: "Store Manager", department: "Management", shop: "Northside Outlet", status: "Active", hireDate: "2024-04-15" },
  { id: "23", name: "Charlotte Wright", role: "Sales Associate", department: "Sales", shop: "Central Plaza Hub", status: "Active", hireDate: "2025-07-01" },
  { id: "24", name: "Benjamin Scott", role: "Inventory Clerk", department: "Operations", shop: "Mall Location", status: "Active", hireDate: "2024-11-20" },
]

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Active: "default",
  "On Leave": "secondary",
  Terminated: "destructive",
}

export default function EmployeesPage() {
  const [search, setSearch] = useState("")

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.shop.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = employees.filter((e) => e.status === "Active").length
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <span>Home</span>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Employees</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employee Management</h1>
          <p className="text-sm text-muted-foreground">Manage all staff members</p>
        </div>
        <AnimateButton variant="accent" asChild>
          <Link href="#">
            <Plus /> Add Employee
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              <Users className="size-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">On Leave</CardTitle>
              <Users className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{onLeaveCount}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
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
                <TableHead>Employee Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Shop Assignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <Link href={`/admin/employees/${emp.id}`} className="hover:underline">
                      {emp.name}
                    </Link>
                  </TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>{emp.shop}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[emp.status] ?? "default"}>
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{emp.hireDate}</TableCell>
                  <TableCell>
                    <AnimateButton size="sm" variant="outline" asChild>
                      <Link href={`/admin/employees/${emp.id}`}>
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

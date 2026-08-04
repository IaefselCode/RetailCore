"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { ChevronRightIcon, FileTextIcon, PackageIcon, CreditCardIcon, UsersIcon, StoreIcon, PlusIcon } from "lucide-react"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const reportCategories = [
  {
    title: "Sales Reports",
    description: "Revenue, orders, and sales performance metrics",
    icon: FileTextIcon,
    reports: ["Daily Sales Summary", "Monthly Revenue Report", "Sales by Product Category", "Sales by Payment Method"],
  },
  {
    title: "Inventory Reports",
    description: "Stock levels, movements, and forecasts",
    icon: PackageIcon,
    reports: ["Current Stock Levels", "Low Stock Alerts", "Inventory Movement", "Stock Valuation"],
  },
  {
    title: "Payment Reports",
    description: "Transaction logs and payment analytics",
    icon: CreditCardIcon,
    reports: ["Transaction History", "Payment Method Breakdown", "Refund Report", "Pending Transactions"],
  },
  {
    title: "People Reports",
    description: "Employee and team performance data",
    icon: UsersIcon,
    reports: ["Employee Sales Performance", "Hours Logged", "Commission Report", "Staff Activity"],
  },
  {
    title: "Store Reports",
    description: "Per-location analysis and comparisons",
    icon: StoreIcon,
    reports: ["Store Comparison", "Location Performance", "Regional Analysis", "Foot Traffic Report"],
  },
]

const reportSections = [
  { id: "revenue", label: "Revenue Data" },
  { id: "orders", label: "Order Details" },
  { id: "products", label: "Product Performance" },
  { id: "employees", label: "Employee Metrics" },
  { id: "inventory", label: "Stock Information" },
  { id: "payments", label: "Payment Breakdown" },
]

export default function ReportsPage() {
  const [open, setOpen] = useState(false)
  const [selectedSections, setSelectedSections] = useState<string[]>([])

  function toggleSection(id: string) {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>Home</span>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground">Reports</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-medium">Reports</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <AnimateButton variant="accent">
              <PlusIcon />
              Generate Custom Report
            </AnimateButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Custom Report</DialogTitle>
              <DialogDescription>
                Configure your custom report parameters
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input id="report-name" placeholder="e.g. Q3 Performance Review" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Date Range</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Sections to Include</Label>
                <div className="grid grid-cols-2 gap-2">
                  {reportSections.map((section) => (
                    <Label key={section.id} className="flex items-center gap-2 cursor-pointer rounded-md border p-2 text-sm font-normal has-data-[state=checked]:border-primary">
                      <Checkbox
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                      {section.label}
                    </Label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <AnimateButton variant="outline" onClick={() => setOpen(false)}>Cancel</AnimateButton>
              <AnimateButton onClick={() => { setOpen(false) }}>Generate Report</AnimateButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {reportCategories.map((category) => (
          <motion.div key={category.title} variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <category.icon className="size-5 text-primary" />
                  </div>
                </div>
                <CardTitle className="mt-2">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {category.reports.map((report) => (
                  <AnimateButton key={report} variant="ghost" className="w-full justify-start text-sm font-normal h-8">
                    <FileTextIcon className="size-3.5 text-muted-foreground" />
                    {report}
                  </AnimateButton>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

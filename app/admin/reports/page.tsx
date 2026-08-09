"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
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
    titleKey: "catSales",
    descriptionKey: "catSalesDesc",
    icon: FileTextIcon,
    reports: ["Daily Sales Summary", "Monthly Revenue Report", "Sales by Product Category", "Sales by Payment Method"],
  },
  {
    titleKey: "catInventory",
    descriptionKey: "catInventoryDesc",
    icon: PackageIcon,
    reports: ["Current Stock Levels", "Low Stock Alerts", "Inventory Movement", "Stock Valuation"],
  },
  {
    titleKey: "catPayment",
    descriptionKey: "catPaymentDesc",
    icon: CreditCardIcon,
    reports: ["Transaction History", "Payment Method Breakdown", "Refund Report", "Pending Transactions"],
  },
  {
    titleKey: "catPeople",
    descriptionKey: "catPeopleDesc",
    icon: UsersIcon,
    reports: ["Employee Sales Performance", "Hours Logged", "Commission Report", "Staff Activity"],
  },
  {
    titleKey: "catStore",
    descriptionKey: "catStoreDesc",
    icon: StoreIcon,
    reports: ["Store Comparison", "Location Performance", "Regional Analysis", "Foot Traffic Report"],
  },
]

// The Inventory Movement report is wired to the real movement-history page
// (spec §48, §74). The remaining entries are placeholders for future work.
const MOVEMENT_REPORT = "Inventory Movement"

const reportSections = [
  { id: "revenue", labelKey: "secRevenue" },
  { id: "orders", labelKey: "secOrders" },
  { id: "products", labelKey: "secProducts" },
  { id: "employees", labelKey: "secEmployees" },
  { id: "inventory", labelKey: "secInventory" },
  { id: "payments", labelKey: "secPayments" },
]

export default function ReportsPage() {
  const t = useTranslations("reports")
  const tc = useTranslations("common")
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
        <span>{tc("home")}</span>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground">{t("breadcrumb")}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-medium">{t("title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <AnimateButton variant="accent">
              <PlusIcon />
              {t("generateCustom")}
            </AnimateButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("generateCustom")}</DialogTitle>
              <DialogDescription>
                {t("configureParams")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="report-name">{t("reportName")}</Label>
                <Input id="report-name" placeholder={t("reportNamePlaceholder")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("dateRange")}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectRange")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">{t("last7")}</SelectItem>
                    <SelectItem value="30">{t("last30")}</SelectItem>
                    <SelectItem value="90">{t("last90")}</SelectItem>
                    <SelectItem value="365">{t("lastYear")}</SelectItem>
                    <SelectItem value="custom">{t("customRange")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("sectionsToInclude")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {reportSections.map((section) => (
                    <Label key={section.id} className="flex items-center gap-2 cursor-pointer rounded-md border p-2 text-sm font-normal has-data-[state=checked]:border-primary">
                      <Checkbox
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                      {t(section.labelKey)}
                    </Label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <AnimateButton variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</AnimateButton>
              <AnimateButton onClick={() => { setOpen(false) }}>{t("generateReport")}</AnimateButton>
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
          <motion.div key={category.titleKey} variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <category.icon className="size-5 text-primary" />
                  </div>
                </div>
                <CardTitle className="mt-2">{t(category.titleKey)}</CardTitle>
                <CardDescription>{t(category.descriptionKey)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {category.reports.map((report) =>
                  report === MOVEMENT_REPORT ? (
                    <AnimateButton key={report} asChild variant="ghost" className="w-full justify-start text-sm font-normal h-8">
                      <Link href="/admin/inventory/movements">
                        <FileTextIcon className="size-3.5 text-muted-foreground" />
                        {report}
                      </Link>
                    </AnimateButton>
                  ) : (
                    <AnimateButton key={report} variant="ghost" className="w-full justify-start text-sm font-normal h-8">
                      <FileTextIcon className="size-3.5 text-muted-foreground" />
                      {report}
                    </AnimateButton>
                  )
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { ChevronRightIcon, SaveIcon, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { updateSystemSettings } from "@/lib/settings-actions"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export interface SystemSettingsData {
  shopName: string
  timezone: string
  currency: string
  dateFormat: string
  sessionTimeout: string
}

export function AdminSettingsForm({ initial }: { initial: SystemSettingsData }) {
  const router = useRouter()
  const t = useTranslations("settings")
  const tc = useTranslations("common")
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    shopName: initial.shopName,
    timezone: initial.timezone,
    currency: initial.currency,
    dateFormat: initial.dateFormat,
    sessionTimeout: initial.sessionTimeout,
  })

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  function handleSave() {
    const fd = new FormData()
    fd.append("shopName", form.shopName)
    fd.append("timezone", form.timezone)
    fd.append("currency", form.currency)
    fd.append("dateFormat", form.dateFormat)
    fd.append("sessionTimeout", form.sessionTimeout)

    startTransition(async () => {
      const result = await updateSystemSettings(fd)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{tc("home")}</span>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground">{t("breadcrumb")}</span>
      </nav>

      <h1 className="text-2xl font-medium">{t("title")}</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>{t("generalSettings")}</CardTitle>
                  <CardDescription>{t("generalSettingsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Currency */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="currency">{t("currency")}</Label>
                      <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD ($)</SelectItem>
                          <SelectItem value="eur">EUR (€)</SelectItem>
                          <SelectItem value="gbp">GBP (£)</SelectItem>
                          <SelectItem value="cad">CAD (C$)</SelectItem>
                          <SelectItem value="tzs">TZS (TSh)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Date Format */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="date-format">{t("dateFormat")}</Label>
                      <Select value={form.dateFormat} onValueChange={(v) => update("dateFormat", v)}>
                        <SelectTrigger id="date-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <AnimateButton onClick={handleSave} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <SaveIcon />}
          {t("saveChanges")}
        </AnimateButton>
      </div>
    </div>
  )
}

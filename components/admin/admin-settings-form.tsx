"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { ChevronRightIcon, SaveIcon, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { updateSystemSettings } from "@/lib/settings-actions"
import { updateNotificationPreferences, type NotificationPreferenceData } from "@/lib/notification-actions"

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
  notificationPrefs?: NotificationPreferenceData
}

export function AdminSettingsForm({ initial }: { initial: SystemSettingsData }) {
  const router = useRouter()
  const t = useTranslations("settings")
  const tc = useTranslations("common")
  const [pending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(initial.notificationPrefs?.emailEnabled ?? true)
  const [smsAlerts, setSmsAlerts] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(initial.notificationPrefs?.pushEnabled ?? true)
  const [twoFactor, setTwoFactor] = useState(false)
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
      await updateNotificationPreferences({ emailEnabled: emailNotifications, pushEnabled: pushNotifications })
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
          <TabsTrigger value="notifications">{t("notifications")}</TabsTrigger>
          <TabsTrigger value="security">{t("security")}</TabsTrigger>
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
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="shop-name">{t("shopName")}</Label>
                      <Input
                        id="shop-name"
                        value={form.shopName}
                        onChange={(e) => update("shopName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="timezone">{t("timezone")}</Label>
                      <Select value={form.timezone} onValueChange={(v) => update("timezone", v)}>
                        <SelectTrigger id="timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc">UTC</SelectItem>
                          <SelectItem value="est">Eastern Time (EST)</SelectItem>
                          <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                          <SelectItem value="cst">Central Time (CST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        </SelectContent>
                      </Select>
                    </div>
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

        <TabsContent value="notifications" className="mt-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>{t("notificationPrefs")}</CardTitle>
                  <CardDescription>{t("notificationPrefsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{t("emailNotifications")}</Label>
                      <p className="text-sm text-muted-foreground">{t("emailNotificationsDesc")}</p>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{t("smsAlerts")}</Label>
                      <p className="text-sm text-muted-foreground">{t("smsAlertsDesc")}</p>
                    </div>
                    <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{t("pushNotifications")}</Label>
                      <p className="text-sm text-muted-foreground">{t("pushNotificationsDesc")}</p>
                    </div>
                    <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>{t("securitySettings")}</CardTitle>
                  <CardDescription>{t("securitySettingsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="current-password">{t("currentPassword")}</Label>
                    <div className="relative">
                      <Input id="current-password" type={showPassword ? "text" : "password"} />
                      <AnimateButton
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                      </AnimateButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="new-password">{t("newPassword")}</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{t("twoFactor")}</Label>
                      <p className="text-sm text-muted-foreground">{t("twoFactorDesc")}</p>
                    </div>
                    <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="session-timeout">{t("sessionTimeout")}</Label>
                    <Select
                      value={form.sessionTimeout}
                      onValueChange={(v) => update("sessionTimeout", v)}
                    >
                      <SelectTrigger id="session-timeout" className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
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

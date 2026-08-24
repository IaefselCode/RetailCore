"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { toast } from "sonner"
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/notification-actions"
import { Bell, Mail, ShoppingCart, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AnimateButton } from "@/components/ui/animate-button"

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export default function EmployeeSettingsPage() {
  const t = useTranslations("employeeSettings")
  const [notifyShift, setNotifyShift] = useState(true)
  const [notifyStock, setNotifyStock] = useState(true)
  const [notifySales, setNotifySales] = useState(false)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Load preferences on mount
  useEffect(() => {
    getNotificationPreferences().then((prefs) => {
      setNotifyShift(prefs.shiftReminders)
      setNotifyStock(prefs.stockAlerts)
      setNotifySales(prefs.salesReports)
      setPrefsLoaded(true)
    })
  }, [])

  const saveChanges = async () => {
    await updateNotificationPreferences({
      shiftReminders: notifyShift,
      stockAlerts: notifyStock,
      salesReports: notifySales,
    })
    toast.success(t("saved"))
  }

  const changePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("fillPasswordFields"))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordMismatch"))
      return
    }
    toast.success(t("passwordChanged"))
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("notificationPrefs")}</CardTitle>
            <CardDescription>{t("notificationPrefsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("shiftReminders")}</p>
                  <p className="text-xs text-muted-foreground">{t("shiftRemindersDesc")}</p>
                </div>
              </div>
              <Switch checked={notifyShift} onCheckedChange={setNotifyShift} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("stockAlerts")}</p>
                  <p className="text-xs text-muted-foreground">{t("stockAlertsDesc")}</p>
                </div>
              </div>
              <Switch checked={notifyStock} onCheckedChange={setNotifyStock} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("salesReports")}</p>
                  <p className="text-xs text-muted-foreground">{t("salesReportsDesc")}</p>
                </div>
              </div>
              <Switch checked={notifySales} onCheckedChange={setNotifySales} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              <div>
                <CardTitle>{t("changePassword")}</CardTitle>
                <CardDescription>{t("changePasswordDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">{t("currentPassword")}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t("newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">{t("confirmNewPassword")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={changePassword}>
              {t("updatePassword")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-end">
        <AnimateButton variant="accent" onClick={saveChanges}>
          {t("saveChanges")}
        </AnimateButton>
      </div>
    </div>
  )
}

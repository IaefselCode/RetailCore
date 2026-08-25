"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"
import { toast } from "sonner"
import { ShoppingCart, Shield, Eye, EyeOff, Check, X, Loader2 } from "lucide-react"
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/notification-actions"
import { changeEmployeePassword } from "@/lib/settings-actions"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" }
  if (score <= 3) return { score, label: "Fair", color: "bg-orange-500" }
  if (score <= 4) return { score, label: "Good", color: "bg-yellow-500" }
  return { score, label: "Strong", color: "bg-green-500" }
}

export default function EmployeeSettingsPage() {
  const t = useTranslations("employeeSettings")

  // Notification preferences
  const [notifyStock, setNotifyStock] = useState(true)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [savingPref, setSavingPref] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Load preferences on mount
  useEffect(() => {
    getNotificationPreferences().then((prefs) => {
      setNotifyStock(prefs.stockAlerts)
      setPrefsLoaded(true)
    })
  }, [])

  const updatePref = async (key: "stockAlerts", value: boolean) => {
    setSavingPref(true)
    try {
      await updateNotificationPreferences({ [key]: value })
      toast.success(t("saved"))
    } catch {
      toast.error(t("somethingWentWrong"))
    } finally {
      setSavingPref(false)
    }
  }

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword])

  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const canChangePassword =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    !changingPassword

  const handleChangePassword = async () => {
    if (!canChangePassword) return

    setChangingPassword(true)
    try {
      const result = await changeEmployeePassword({
        currentPassword,
        newPassword,
      })
      if (result.success) {
        toast.success(result.message)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error(t("somethingWentWrong"))
    } finally {
      setChangingPassword(false)
    }
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

      {/* Notification Preferences */}
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
                <ShoppingCart className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("stockAlerts")}</p>
                  <p className="text-xs text-muted-foreground">{t("stockAlertsDesc")}</p>
                </div>
              </div>
              <Switch
                checked={notifyStock}
                disabled={!prefsLoaded || savingPref}
                onCheckedChange={(v) => {
                  setNotifyStock(v)
                  updatePref("stockAlerts", v)
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password */}
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
            {/* Current Password */}
            <div className="space-y-1.5">
              <Label htmlFor="current-password">{t("currentPassword")}</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("currentPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t("newPassword")}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("newPassword")}                    />
                    <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {/* Password Strength */}
              {newPassword.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("passwordStrength")}</span>
                    <span className={`text-xs font-medium ${strength.score <= 2 ? "text-red-500" : strength.score <= 3 ? "text-orange-500" : strength.score <= 4 ? "text-yellow-600" : "text-green-600"}`}>
                      {strength.label}
                    </span>
                  </div>
                  <Progress value={(strength.score / 5) * 100} className="h-1.5" />
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className={newPassword.length >= 8 ? "text-green-600" : ""}>
                      {newPassword.length >= 8 ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                      {" "}{t("minLength")}
                    </span>
                    <span className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                      {/[A-Z]/.test(newPassword) ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                      {" "}{t("uppercase")}
                    </span>
                    <span className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                      {/[a-z]/.test(newPassword) ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                      {" "}{t("lowercase")}
                    </span>
                    <span className={/\d/.test(newPassword) ? "text-green-600" : ""}>
                      {/\d/.test(newPassword) ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                      {" "}{t("number")}
                    </span>
                    <span className={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : ""}>
                      {/[^A-Za-z0-9]/.test(newPassword) ? <Check className="inline size-3" /> : <X className="inline size-3" />}
                      {" "}{t("symbol")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">{t("confirmNewPassword")}</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirmNewPassword")}                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-xs ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                  {passwordsMatch ? (
                    <><Check className="inline size-3" /> {t("passwordsMatch")}</>
                  ) : (
                    <><X className="inline size-3" /> {t("passwordMismatch")}</>
                  )}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              onClick={handleChangePassword}
              disabled={!canChangePassword}
            >
              {changingPassword ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> {t("changing")}</>
              ) : (
                t("updatePassword")
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
